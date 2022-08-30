# Instructions
This is the configuration file for the Readwise Inbox tool. It contains the default values for this tool in your vault. Most of these settings can be overridden with frontmatter on a page where this view is embedded. See the [[readme.md]] file for more info.

This configuration file uses inline fields. An inline field is made up of 3 elements:
- The Field name
- Two colons 
- the value

Example
`FieldName:: Field value`

# Configuration settings

## LimitHighlightCount
**Definition**: The number of highlights to display. Can be overridden in a pages frontmatter.

LimitHighlightCount:: 20

## SortDateAscending
**Definition**: true will sort ascending, false will sort descending. Can be overridden in a pages frontmatter.

SortDateAscending:: true

## ReadwisePathLogProcessed
**Definition**: Name of log file for processed highlights.

ReadwisePathLogProcessed:: rw-inbox-log-processed

## FilterTags
**Definition:** Only show highlight blocks that contain the specified tag. The option should be specified without the hash mark (\#concept-todo => concept-todo)  **Note well:** for this to work, tags must be included in the block. 

==TODO: have the option to filter in this file?==
==TODO: turn into a list?==

==custom==
Only show highlight blocks containing the specified tag
Tag should be specified WITHOUT the name (\#concept-todo => concept-todo)
by default, this will not be set

## FilterTagsToExclude
==custom== list of tags to exclude

FilterTagsToExclude::[anki-added, concept-processed]
