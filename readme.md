# Readwise Inbox for Obsidian

## Warning

This solution is intended for users who are comfortable hacking around Obsidian and don't mind reading documentation. I assume you have a basic knowledge of the Readwise Plugin, Dataview Plugin and how block references work in Obsidian.

If you don't know these things or are not prepared to do some reading to learn them, then this solution is not for you.

Please feel free to contact me on twitter if you have questions, but please make sure you have read this document thoroughly. If you respect my time, I will respect yours.

## Introduction

The Readwise Inbox tool provides an inbox of highlights that need to be processed. Processing depends on your workflow, but mine works like this:

- Highlights are imported via the [Readwise plugin](https://github.com/readwiseio/obsidian-readwise). 
    - I never edit the files imported by Readwise directly. This way if my highlights are exported, my personal notes linked to them are never broken.
- In another note that I create in my vault, I make notes on the imported highlights. Again, I do not edit the export file. 
    - If I want to refer to contents of a highlight, I block reference it. For more info on block references, see this link to [Links to Block](https://help.obsidian.md/How+to/Link+to+blocks) in the Obsidian online help.
- Once I have made my note, I mark the highlight has processed in the Readwise Inbox by clicking on the button with the X in it.

With this tool, you can see an "inbox" of unproccessed highlights from Readwise. You process each highlight one at a time. If you click X button, it marks it as complete and disappears from your inbox.

You can use the A and T buttons to copy block references to your clipboard. These references are then used in your own personal notes to refer back to the block reference.

## Buttons
The tool has the following buttons for each highlight:

- X - Marks the highlight as processed
- B - Copies a block reference to the clipboard
- A - Copies a block reference as an alias with an asterisk to the clipboard
- T - Copies the text of the highlight and a block reference as an alias with an asterisk to the clipboard

The + sign at the end is a link to the block reference in the file.

## Additional information

This tool builds on the concept presented in this article [Using Readwise’s highlight_id as a single source of truth in Obsidian](https://tfthacker.medium.com/using-readwises-highlight-id-as-a-single-source-of-truth-in-obsidian-b1de98a8b87c).

This tool assumes that each highlight has an assigned block identifier based on the Readwise highlight identifier.

## Dependencies

The following Obsidian plugins are required for this solution:
- Plugin: Readwise Official Plugin 
  - It is assumed this plugin is configured and the highlights are synced into your vault.
  - Also that you have enabled a unique block identifier for each highlight as mentioned in the "Additional information" section of this readme file.
- Plugin: Dataview
  - In settings, **Enable JavaScript Queries** needs to be toggled on (you might need to reset Obsidian for this to take effect)
- Plugin: Buttons

## Export Formatting Requirements

This dataview setup expects that each highlight in your export list will have an associated block ID that corresponds to the Readwise highlight ID. You will need to add something like the following to your export in the highlight section:

```jinja2
^rw{{highlight_id}}
```

As described the article above, we add a `rw` prefix to the ID so that we can differentiate Readwise IDs from other blocks in the system. You can add any prefix you want (or no prefix), as the code strips out all non-numerical values.

Where you place this block reference matters, since it controls what the dataview query will see. If you want to just see the highlight text, you can place it after the text.

```jinja2
- {{ highlight_text }} ^rw{{highlight_id}}
```

However, if you want to use the more advanced capabilities, like tag filtering, you will need to ensure that the placement of the block reference includes any tags. You can do this by including a list of tags following the highlight text, with the block following that. Or, you can place the block reference at the end of an individual list element, which will pull in the whole list item. This will not affect formatting of the exported note - in preview, it will show up as expected.

```jinja2
- {{ highlight_text }}{% if highlight_tags %} 
    - Tagged:{% for tag in highlight_tags %} #{{tag|replace(" ","-")}}{% endfor %}{% endif %}
    - {% if highlight_location and highlight_location_url %}[{{highlight_location}}]({{highlight_location_url}}), {% elif highlight_location %} {{highlight_location}}, {% endif %}[Open in Readwise](https://readwise.io/open/{{highlight_id}}){% if highlight_note %}
    - Note: {{ highlight_note }}{% endif %}
^rw{{highlight_id}}
```

This will export to something like:

```jinja2
- A sample highlight 
    - Tagged: #sample-tag #funny
    - [Page 2](https://readwise.io), [Open in Readwise](https://readwise.io/open/1234)
^rw1234
```

This workflow also expects that Readwise tags are exported AS tags (`#tag-name`) instead of as links. We also recommend converting spaces to dashes or underscores, as Obsidian does not allow spaces in tag names.

## Installation

Copy the rw-inbox folder (and all its contents) into your vault. 

With this folder in your vault, open the **rw-inbox-viewer.md** file. This will display your highlights from the Readwise export folder. 

This folder consists of the following:
- subfolder called **rw-inbox-view**. The files in this folder should not be edited. It is the code used by the Dataview plugin to create the view of our readwise inbox.
- file **rw-inbox-config.md** contains the default configuration information for this solution
- file **rw-inbox-log-processed.md** contains the log of processed highlights. Normally you would not edit this file. It contains the block reference id numbers of processed highlights.
- file **rw-inbox-viewer.md** is an example of how to use this solution. It contains a dataviewjs query that can be used in any markdown file in your vault. See the next section for more details.

## How to use

A simple `dataviewjs` query formatted as follows will retrieve your Readwise highlights:

~~~
```dataviewjs
dv.view("rw-inbox-view");
```
~~~

This `dataviewjs` query can be put into any page. 

You can control some aspects of the output of this query by specifying various configuration keys. The list of supported configuration options is found in` rw-inbox-config.md`. These configuration options specify the defaults for _all_ queries.

You can also set each configuration value in the [front matter](https://help.obsidian.md/Advanced+topics/YAML+front+matter) of a file or as inline dataview markup. This will override the default setting for that file.

### Filtering Highlights by Tag

If tags are observable through the block reference, you can filter the highlights that are displayed using the `FilterTags` and `FilterTagsToExclude` properties. These can be specified as single values or lists. When used as a list, the `FilterTags` values represent a logical OR - any of the specified tags will be included. Likewise, `FilterTagsToExclude` is a logical NOR - if any of the specified tags are found, the highlight will not be included.

`FilterTags` will cause the view to present only highlights that include the specified tags.

`FilterTagsToExclude` is used to exclude highlights with specific tags. This is useful for when you've already processed something in a separate workflow and want it excluded here, or when you have potential naming collisions that necessitate refined filtering.

```yaml
---
FilterTags: anki
FilterTagsToExclude: [anki-added, processed]
---
```

### Processing Tags

You can configure a workflow that will add/remove tags on highlights when you process them with the "X" button. The tags that will be added or removed are specified via configuration options.

```yaml
---
OnProcessRemoveTags: [anki]
OnProcessAddTags: anki-added
---
```

### Querying for specific information

The `rw-inbox-view` accepts an optional parameter, a `dv.pages` object. This object can be used to provide a refined set of pages based on a JavaScript Dataview query. 

The following example return just tweets:

```dataviewjs
const tweets = dv.pages('"Readwise/tweets"')
dv.view("rw-inbox-view", tweets );
```

All Twitter highlights from this year:

```dataviewjs
const tweets = dv.pages('"Readwise/tweets"').filter(p=>new Date(p.created)>new Date("2022-01-01"))
dv.view("rw-inbox-view", tweets );
```

Highlights that have been tagged with `#priority`, and from the Readwise export folder

```dataviewjs
const byTags = dv.pages("#priority and \"30-Files/99-ReadwiseSync\"")
dv.view("rw-inbox-view", byTags );
```

Highlights that have been tagged with `#priority` or `#important`, and from the Readwise export folder

```dataviewjs
const byTags = dv.pages("(#priority or #important) and \"30-Files/99-ReadwiseSync\"")
dv.view("rw-inbox-view", byTags );
```

Return all highlights with the frontmatter source value equal to a specific author:

```dataviewjs
const byAuthor = dv.pages('"30-Files/99-ReadwiseSync"').where(p=>p.file.frontmatter?.author=='nickwignall.com')
dv.view("rw-inbox-view", byAuthor);
```
