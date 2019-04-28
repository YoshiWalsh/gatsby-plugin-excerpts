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

const config = {
    excerpts: {
        snippet: {
            type: "html",
            appliesToNodeTypes: ["MarkdownRemark"],
            sources: [
                {
                    type: "htmlQuery",
                    sourceField: "html",
                    excerptSelector: ".custom-block.excerpt .custom-block-body",
                    stripSelector: "a"
                },
                {
                    type: "htmlQuery",
                    sourceField: "html",
                    excerptSelector: "html > *",
                    ignoreSelector: "img, .custom-block.iconBox, .custom-block.aside, details, .gatsby-highlight",
                    stripSelector: "a"
                }
            ]
        }
    }
};

let text = (o: Cheerio): string => o.text();

abstract class SourceType<T, U, V> {
    constructor(settings: T) {

    }

    public abstract search(fieldContents: U): V;

    public abstract outputConverters: {
        text: (o: V) => string,
        html: (o: V) => string
    };
}

interface HtmlQuerySettings {
    type: "htmlQuery",
    sourceField: string,
    excerptSelector: string,
    ignoreSelector?: string,
    stripSelector?: string
}

class HtmlQuery extends SourceType<HtmlQuerySettings, string, Cheerio> {
    private settings: HtmlQuerySettings;
    constructor(settings: HtmlQuerySettings) {
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
            let span = $('<span></span>').html($element.html());
            $element.replaceWith(span);
        });
        if($outputContainer.children().length < 1) {
            return null;
        }
        return $outputContainer;
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

async function getExcerpt(excerptType, node, info: any, ctx: any) {
    const excerptSettings = config.excerpts[excerptType];
    const fieldCache = {};

    for(let i = 0; i < excerptSettings.sources.length; i++) {
        const source = excerptSettings.sources[i];

        if(!fieldCache[source.sourceField]) {
            // HACK
            // If anyone knows a better way to get the value of another field, please let me know!
            // This calls the other field's resolve function, but we don't get all the arguments right.
            // For example, we pass the 'info' argument for our field, not the other field.
            // Hopefully this will work well enough for most people's purposes.
            try {
                fieldCache[source.sourceField] = await Promise.resolve(info.parentType._fields[source.sourceField].resolve.call(this, node, {}, ctx, info));
            } catch (ex) {
                console.error("[gatsby-plugin-excerpts] Failed to retrieve field", source.sourceField, "for excerpt", excerptType, "on node", JSON.stringify(node), "");
            }
        }
        const sourceFieldValue = fieldCache[source.sourceField];

        let searcher = new excerptSourceTypes[source.type](source);
        let results = searcher.search(sourceFieldValue);

        if(results) {
            return searcher.outputConverters[excerptSettings.type](results);
        }
    }
};

export async function setFieldsOnGraphQLNodeType({type}) {
    let fields = {};
    for(const k in config.excerpts) {
        if(config.excerpts[k].appliesToNodeTypes.indexOf(type.name) !== -1) {
            fields[k] = {
                type: GraphQLString,
                resolve: (s, args, ctx, info) => getExcerpt(k, s, info, ctx)
            };
        }
    }

    return fields;
}