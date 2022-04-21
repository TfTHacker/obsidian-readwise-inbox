# Warning
This solution is intended for users who are comfortable hacking around Obsidian and don't mind reading documentation. I assume you have a basic knowledge of the Readwise Plugin, Dataview Plugin and how block references work in Obsidian.

If you don't know these things or are not prepared to do some reading to learn them, then this solution is not for you.

Please feel free to contact me on twitter if you have questions, but please make sure you have read this document thoroughly. If you respect my time, I will respect yours.

# Introduction
The Readwise Inbox tool provides an inbox of highlights that need to be processed. Processing depends on your workflow, but mine works like this:
- Highlights are imported via the [Readwise plugin](https://github.com/readwiseio/obsidian-readwise). I never edit the files imported by Readwise directly. This way if my highlights are exported, my personal notes linked to them are never broken.
- In another note that I create in my vault, I make notes on the imported highlights. I do not edit the export file. If I want to refer to contents of a highlight, I block reference it. For more info on block references, see this link to [Links to Block](https://help.obsidian.md/How+to/Link+to+blocks) in the Obsidian online help.
- Once I have made my note, I mark the highlight has processed in the Readwise Inbox by clicking on the button with the X in it.

With this tool, you can see an "inbox" of unproccessed highlights from readwise. You process each highlight one at a time. If you click X button, it marks it as complete and disappears from your inbox.

You can use the A and T buttons to copy block references to your clipboard. These references are then used in your own personal notes to refer back to the block reference.

## Additional features
The tool has 3 buttons for each highlight. The following list describes the button
- X - Marks the highlight as processed
- B - Copies a block reference to the clipboard
- A - Copies a block reference as an alias with an asterisk to the clipboard
- T - Copies the text of the higlight and a block reference as an alias with an asterisk to the clipboard

The + sign at the end is a link to the block reference in the file.

## Additional information
This tool builds on the concept presented in this article [Using Readwise’s highlight_id as a single source of truth in Obsidian](https://tfthacker.medium.com/using-readwises-highlight-id-as-a-single-source-of-truth-in-obsidian-b1de98a8b87c).

This tool assumes that each highlight has an assigned block identifier based on the Readwise highlight identifier.

# Dependencies
The following Obsidian plugins are required for this solution:
- Plugin: Readwise Official Plugin 
  - It is assumed this plugin is configured and the highlights are synced into your vault.
  - also that you have enabled a unique block identifier for each highlight as mentioned in the "Additional information" section of this readme file.
- Plugin: Dataview
  - In settings, **Enable JavaScript Queries** needs to be toggled on
- Plugin: Buttons

# Installation
Copy the rw-inbox folder (and all its contents) into your vault. 

With this folder in your vault, open the rw-inbox-viewer.md file. This will display your highlights from the Readwise export folder. 

This folder consists of the following:
- subfolder called **rw-inbox-view**. The files in this folder should not be edited. It is the code used by the Dataview plugin to create the view of our readwise inbox.
- file **rw-inbox-config.md** contains the default configuration information for this solution
- file **rw-inbox-log-processed.md** contains the log of processed highlights. Normally you would not edit this file. It contains the block reference id numbers of processed highlights.
- file **rw-inbox-viewer.md** is an example of how to use this solution. It contains a dataviewjs query that can be used in any markdown file in your vault. See the next section for more details.

# How to use
A simple dataviewjs query formatted as follows will retrieve your Readwise highlights:

~~~
```dataviewjs
dv.view("rw-inbox-view");
```
~~~

This dataviewjs query can be put into any page. 

You can control some aspects of the output of this query by using the following [front matter](https://help.obsidian.md/Advanced+topics/YAML+front+matter):

- LimitHighlightCount - number of highlights to display
- SortDateAscending - default sort is date ascending. Set to false for it to sort in descending date order.

# Querying for specific information
The rw-inbox-view accepts an optional parameter, a dv.pages object. This object can be used to provide a refined set of pages based on a JavaScript Dataview query. 

NOTE: This is for advanced users who have experience with JavaScript.

The following example return just tweets:

~~~
```dataviewjs
const tweets = dv.pages('"20-Readwise/tweets"')
dv.view("rw-inbox-view", tweets );
```
~~~

Or all Twitter highlights from this year:

~~~
```dataviewjs
const tweets = dv.pages('"20-Readwise/tweets"').filter(p=>new Date(p.created)>new Date("2022-01-01"))
dv.view("rw-inbox-view", tweets );
```
~~~
