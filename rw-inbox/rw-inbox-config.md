# Readwise Inbox Configuration

This is the configuration file for the Readwise Inbox tool. It contains the default values for all views in your vault. These settings can also be overridden in individual files, whether in the YAML front-matter or in an inline dataview tag.

This configuration file uses inline fields to set defaults. An inline field is made up of 3 elements:
- The Field name
- Two colons 
- the value


Example:
```
FieldName:: Field value
```

# Configuration settings

## LimitHighlightCount

**Definition**: The number of highlights to display. Defaults to 20 if unspecified, has a maximum value of 1000.

LimitHighlightCount:: 20

## SortDateAscending

**Definition**: true will sort ascending, false will sort descending. 

SortDateAscending:: true

## ReadwisePathLogProcessed

**Definition**: Name of log file for processed highlights.

ReadwisePathLogProcessed:: rw-inbox-log-processed

## FilterTags

**Definition:** Only show highlight blocks that contain the specified tag(s). Tag names should specified without the hash mark (\#concept-todo => concept-todo). You can specify either a single value or a list of values. When a list is used, the include logic is a logical OR - a highlight featuring any of the specify tags will be included.

**Note:** for this to work, tags must be included in the block, please see the Readme for more information.

Examples:
```
FilterTags:: concept-todo
FilterTags:: [concept-todo, todo, extract]
```

## FilterTagsToExclude
**Definition:** Exclude highlight blocks that contain the specified tag(s). Tag names should specified without the hash mark (\#concept-todo => concept-todo). You can specify either a single value or a list of values. When a list is used, the include logic is a logical NOR - a highlight featuring any of the specify tags will be excluded.

**Note:** for this to work, tags must be included in the block, please see the Readme for more information.

FilterTagsToExclude::[anki-added, concept-processed]
