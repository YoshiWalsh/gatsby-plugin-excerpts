import { graphql } from 'gatsby'
import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLInt,
    GraphQLEnumType,
    GraphQLJSON,
    GraphQLBoolean,
  } from 'gatsby/graphql';
import cheerio from 'cheerio';
import truncate from 'truncate-html';
import {IExcerptsPluginConfiguration, IExcerptSourceConfigurationBase, IExcerptSourceConfigurationHtmlQuery} from './ConfigurationTypes';

let config: IExcerptsPluginConfiguration = {
    sources: {},
    sourceSets: {},
    excerpts: {}
};

export function onPreInit(_: any, configuration: IExcerptsPluginConfiguration) {
    config = configuration;
}

abstract class SourceType<T extends IExcerptSourceConfigurationBase, U, V> {
    constructor(settings: T) {}

    public abstract search(fieldContents: U): V;

    public abstract outputConverters: {
        text: (o: V) => string,
        html: (o: V) => string
    };
}

class HtmlQuery extends SourceType<IExcerptSourceConfigurationHtmlQuery, string, Cheerio> {
    private settings: IExcerptSourceConfigurationHtmlQuery;
    constructor(settings: IExcerptSourceConfigurationHtmlQuery) {
        super(settings);
        this.settings = settings;
    }

    public search(fieldContents: string): Cheerio {
        const $ = cheerio.load(fieldContents);
        const $outputContainer = $("<div>");
        $(this.settings.excerptSelector).appendTo($outputContainer);
        $outputContainer.find(this.settings.ignoreSelector).remove();
        $outputContainer.find(this.settings.stripSelector).each((index, element) => {
            let $element = $(element);
            $element.replaceWith(element.childNodes);
        });
        this.settings.elementReplacements.forEach(replacement => {
            $outputContainer.find(replacement.selector).each((index, element) => {
                element.tagName = replacement.replaceWith;
            });
        });
        if($outputContainer.children().length < 1) {
            return null;
        }
        if(this.settings.truncate) {
            return cheerio.load(truncate($outputContainer.html(), this.settings.truncate)).root();
        } else {
            return $outputContainer;
        };
    }

    public outputConverters = {
        html: function(o: Cheerio) {
            return o.html();
        },
        text: function(o: Cheerio) {
            return o.text();
        }
    };
}

const excerptSourceTypes: { [type: string]: new (any) => SourceType<any, any, any> } = {
    htmlQuery: HtmlQuery
};

async function getExcerpt(excerptName, nodeType, node, info: any, ctx: any) {
    const excerptSettings = config.excerpts[excerptName];
    const sourceSetName = excerptSettings.nodeTypeSourceSet[nodeType] || excerptSettings.nodeTypeSourceSet["*"];
    const sourceSet = config.sourceSets[sourceSetName];
    if(!sourceSet) {
        const err = "[gatsby-plugin-excerpts] Source Set " + sourceSetName + " is referenced by excerpt " + excerptName + " but does not exist.";
        console.error(err);
        throw new Error(err);
    }
    const fieldCache = {};

    for(let i = 0; i < sourceSet.length; i++) {
        const sourceName = sourceSet[i];
        const source = config.sources[sourceName];
        if(!source) {
            const err = "[gatsby-plugin-excerpts] Source " + sourceName + " is referenced by Source Set " + sourceSetName + " but does not exist.";
            console.error(err);
            throw new Error(err);
        }

        if(!fieldCache[source.sourceField]) {
            if(info.parentType._fields[source.sourceField]) {
                try {
                    // HACK
                    // If anyone knows a better way to get the value of another field, please let me know!
                    // This calls the other field's resolve function, but we don't get all the arguments right.
                    // For example, we pass the 'info' argument for our field, not the other field.
                    // Hopefully this will work well enough for most people's purposes.
                    fieldCache[source.sourceField] = await Promise.resolve(info.parentType._fields[source.sourceField].resolve.call(this, node, {}, ctx, info));
                } catch (ex) {
                    console.warn("[gatsby-plugin-excerpts] Failed to retrieve field", source.sourceField, "for source", sourceName, "on node", JSON.stringify(node), ". Error: ", ex);
                }
            } else {
                console.log("[gatsby-plugin-excerpts] Attempted to retrieve non-existent field", source.sourceField, "for source", sourceName, "in excerpt", excerptName, "with node of type", nodeType, ". Ignoring.");
            }
            
        }
        const sourceFieldValue = fieldCache[source.sourceField];

        if(sourceFieldValue !== undefined) {
            let searcher = new excerptSourceTypes[source.type](source);
            let results = searcher.search(sourceFieldValue);

            if(results) {
                return searcher.outputConverters[excerptSettings.type](results);
            }
        }
    }
};

export async function setFieldsOnGraphQLNodeType({type}) {
    let fields = {};
    for(const excerptName in config.excerpts) {
        const excerpt = config.excerpts[excerptName];
        const sourceSetName = excerpt.nodeTypeSourceSet[type.name] || excerpt.nodeTypeSourceSet["*"];
        if(sourceSetName) {
            fields[excerptName] = {
                type: GraphQLString,
                resolve: (node, args, ctx, info) => getExcerpt(excerptName, type.name, node, info, ctx)
            };
        }
    }

    return fields;
}