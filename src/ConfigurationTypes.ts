import {IOptions as ITruncateOptions} from 'truncate-html';

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
        [sourceName: string]: IExcerptSourceConfiguration
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
        [sourceSetName: string]: Array<string>
    }

    /**
     * A collection of Excerpts which will be added as GraphQL fields to relevant nodes.
     * 
     * Note that if you are using gatsby-transformer-remark the name 'excerpt' is already taken, so you cannot use this name.
     * 
     * ## Example
     * This example defines a 'snippet' Excerpt which will use the markdownHtml Source Set on MarkdownRemark nodes.
     * ```json
{
    "snippet": {
        "type": "html",
        "nodeTypeSourceSet": {
            "MarkdownRemark": "markdownHtml"
        }
    }
}
```
     */
    excerpts: {
        [excerptName: string]: IExcerptConfiguration
    }
}

export interface IExcerptConfiguration {
    /**
     * The desired output type of this excerpt.
     * 
     * Valid values:
     *  * text - Excerpt will be converted to plain text
     *  * html - Excerpt will be converted to HTML
     */
    type: string;

    /**
     * A mapping of Node Types to add this excerpt to and the Source Set to use for each type.
     * \* can be used to apply a Source Set to all Node Types, although this is not usually useful.
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
    sourceField: string;
}


export interface IExcerptSourceConfigurationHtmlQuery extends IExcerptSourceConfigurationBase {
    type: "htmlQuery";
    /**
     * The name of the field to search for the excerpt within.
     * For example, with gatsby-transformer-remark you probably want to use 'html'.
     */
    sourceField: string;
    /**
     * A CSS selector that determines which content to include in the excerpt.
     * 
     * @defaultValue `'*'`
     * @see [css-select supported selectors](https://www.npmjs.com/package/css-select#supported-selectors)
     */
    excerptSelector?: string;
    /**
     * A CSS selector representing tags that should be stripped from the excerpt while preserving their content.
     * 
     * @defaultValue none
     * @see [css-select supported selectors](https://www.npmjs.com/package/css-select#supported-selectors)
     * 
     * ## Example
     * To remove links from the excerpt, specify `'a'`
     */
    stripSelector?: string;
    /**
     * A CSS selector representing tags that should be excluded from the excerpt, also removing their content.
     * 
     * @defaultValue none
     * @see [css-select supported selectors](https://www.npmjs.com/package/css-select#supported-selectors)
     * 
     * ## Example
     * To remove `gatsby-remark-prismjs` code snippets from the excerpt, use `'.gatsby-highlight'`
     */
    ignoreSelector?: string;
    /**
     * Allows for swapping certain elements with other elements, preserving their attributes and content.
     * Replacements will be executed in order. Be careful to think through how your replacements might affect each other.
     * For example, replacing h2 with h3 and then h3 with h4 will result in h2 elements becoming h4. Replacing h3 with h4 and then h2 with h3 will result in h2 elements becoming h3, which is probably your intended behaviour.
     */
    elementReplacements?: [
        {
            /**
             * A CSS selector representing elements that you want to replace.
             * 
             * @see [css-select supported selectors](https://www.npmjs.com/package/css-select#supported-selectors)
             */
            selector: string;
            /**
             * The element type that you wish to replace the elements with.
             */
            replaceWith: string;
        }
    ];

    /**
     * Used to trim the resulting HTML down to a specific length.
     * 
     * @see [truncate-html documentation](https://www.npmjs.com/package/truncate-html#api)
     */
    truncate?: ITruncateOptions;
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