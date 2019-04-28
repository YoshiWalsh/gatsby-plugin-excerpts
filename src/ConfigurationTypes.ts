export interface IExcerptsPluginConfiguration {
    /**
     * A collection of named Sources.
     * Each Source can be used in any number of Source Sets.
     * 
     * ## Example
     * This example defines a Source called 'excerptElement' which attempts to include the contents of any elements with class "excerpt".
     * It also defines a Source called 'default' will include any elements other than images or code blocks.
     * Both sources strip links from the resulting excerpt.
     * ```json
{
    "excerptElement": {
        "type": "htmlQuery",
        "sourceField": "html",
        "excerptSelector": ".excerpt",
        "stripSelector": "a"
    },
    "default": {
        "type": "htmlQuery",
        "sourceField": "html",
        "excerptSelector": "html > *",
        "ignoreSelector": "img, .gatsby-highlight",
        "stripSelector": "a"
    }
}
```
     */
    sources: {
        [name: string]: IExcerptSourceConfiguration
    }

    /**
     * A collection of named Source Sets.
     * Each Source Set can be assigned to one or more Node Types.
     * 
     * ## Example
     * This example defines a Source Set called 'markdownHtml' that will first attempt to use the excerptElement source. If this source does not find any valid excerpt, the 'default' source will be tried instead. 
     * ```json
{
    "markdownHtml": [
        "excerptElement",
        "default"
    ]
}
```
     */
    sourceSets: {
        [name: string]: Array<string>
    }

    excerpts: {
        [excerptName: string]: IExcerptConfiguration
    }
}

export interface IExcerptConfiguration {
    /**
     * The desired output type of this excerpt
     */
    type: string;

    /**
     * A mapping of Node Types to add this excerpt to and the Source Set to use for each type.
     * * can be used to apply a Source Set to all Node Types, although this is not usually useful.
     * 
     * ## Example
     * ```json
{
    "MarkdownRemark": "default"
}
```
     */
    nodeTypeSourceSet: {
        [nodeType: string]: string;
    }
}

export type IExcerptSourceConfiguration = IExcerptSourceConfigurationHtmlQuery;

export abstract class IExcerptSourceConfigurationBase {
    type: string;
}

export interface IExcerptSourceConfigurationHtmlQuery extends IExcerptSourceConfigurationBase {
    type: "htmlQuery";
    sourceField: string;
    excerptSelector: string;
    stripSelector?: string;
    ignoreSelector?: string;
}

/*
const example: IExcerptsPluginConfiguration = {
    sources: {
        "excerptElement": {
            type: "htmlQuery",
            sourceField: "html",
            excerptSelector: ".custom-block.excerpt .custom-block-body",
            stripSelector: "a"
        },
        "default": {
            type: "htmlQuery",
            sourceField: "html",
            excerptSelector: "html > *",
            ignoreSelector: "img, .custom-block.iconBox, .custom-block.aside, details, .gatsby-highlight",
            stripSelector: "a"
        }
    },
    sourceSets: {
        "markdownHtml": [
            "excerptElement",
            "default"
        ]
    },
    excerpts: {
        snippet: {
            type: "html",
            nodeTypeSourceSet: {
                "MarkdownRemark": "markdownHtml"
            }
        }
    }
};
*/