// Readwise Inbox 
// More info: https://github.com/TfTHacker/obsidian-readwise-inbox
// File version: 0.1.1

// TODO: option to remove this block from processing display - {Tagged: #anki}

( async ()=>{
    const {createButton} = app.plugins.plugins["buttons"]

    /********
    * Files *
    ********/

    /// This is the file that will be used to specify (default) settings that apply to ALL queries
    const configFile = dv.page("rw-inbox-config")

    /// Log file that is used to record the processed block IDs
    const lgName = configFile.ReadwisePathLogProcessed;
    const lgTFile = await app.vault.getMarkdownFiles().find(e=>e.basename===lgName);
    let log = (await app.vault.cachedRead(lgTFile)).split("\n")

    /************************
    * Configuration Options *
    ************************/

    /*** Highlight Limit ***/
    const limitHighlightCount = function(){
        let val = configFile.hasOwnProperty("LimitHighlightCount") ? configFile.LimitHighlightCount : 20 //default to 20 highlights
        val = dv.current().LimitHighlightCount ? dv.current().LimitHighlightCount : val // pull if limit from current page
        val = val > 1000 ? 1000 : val
        return val;
    }();

    /*** Filtering on Tags - Includes and Excludes ***/
    const filterTags = function(){
        let val = dv.current().FilterTags ? dv.current().FilterTags :
            configFile.hasOwnProperty("FilterTags") ? configFile.FilterTags : null;

        if(val && !Array.isArray(val))
        {
            val = [val];
        }

        return val;
    }();

    const filterTagsToExclude = function(){
        let val = dv.current().FilterTagsToExclude ? dv.current().FilterTagsToExclude :
            configFile.hasOwnProperty("FilterTagsToExclude") ? configFile.FilterTagsToExclude : null;

        // We need to coerce single values into an array for consistent processing
        if(val && !Array.isArray(val))
        {
            val = [val];
        }

        return val;
    }();

    /*** Processing Tags - Add and Remove ***/
    const OnProcessRemoveTags = function(){
        // Prefer specification in file, then specification in config, then a default
        let val = dv.current().OnProcessRemoveTags ? dv.current().OnProcessRemoveTags :
            configFile.hasOwnProperty("OnProcessRemoveTags") ? configFile.OnProcessRemoveTags : null;

        // We need to coerce single values into an array for consistent processing
        if(val && !Array.isArray(val))
        {
            val = [val];
        }

        return val;
    }();

    const OnProcessAddTags = function(){
        let val = dv.current().OnProcessAddTags ? dv.current().OnProcessAddTags : configFile.hasOwnProperty("OnProcessAddTags") ? configFile.OnProcessAddTags : null;

        // We need to coerce single values into an array for consistent processing
        if(val && !Array.isArray(val))
        {
            val = [val];
        }

        return val;
    }();

    const sortDateAscending = function(){
        let val = configFile.hasOwnProperty("SortDateAscending") ? Boolean(configFile.SortDateAscending) : true //default to true
        val = dv.current().hasOwnProperty("SortDateAscending") ? dv.current().SortDateAscending : val // pull if limit from current page
        return val;
    }();

    /*** Filtering Content Within Quotes ***/
    const FilterFromQuoteDisplay = function(){
        // Prefer specification in file, then specification in config, then a default
        let regex_string = dv.current().FilterFromQuoteDisplay ? dv.current().FilterFromQuoteDisplay :
            configFile.hasOwnProperty("FilterFromQuoteDisplay") ? configFile.FilterFromQuoteDisplay : null;

        if(regex_string)
        {
            return new RegExp(regex_string, 'g')
        }
        else
        {
            return null;
        }
    }();

    const FilterFromClipboardCopy = function(){
        // Prefer specification in file, then specification in config, then a default
        let regex_string = dv.current().FilterFromClipboardCopy ? dv.current().FilterFromClipboardCopy :
            configFile.hasOwnProperty("FilterFromClipboardCopy") ? configFile.FilterFromClipboardCopy : null;

        if(regex_string)
        {
            return new RegExp(regex_string, 'g')
        }
        else
        {
            return null;
        }
    }();

    /************************
    * Readwise API Requests *
    ************************/

    /// This header should be set for all Readwise API transactions,
    /// otherwise you will get Error 401
    const readwise_auth_header =
    {
        "Authorization": "Token " + app.plugins.plugins["readwise-official"].settings.token
    }

    /// This function retrieves the tags associated with the highlight.
    /// This method is used to find the proper Readwise tag ID for use
    /// with removeTagRequest()
    async function getHighlightTagsRequest(rw_highlight_id)
    {
        const highlight_tags = await requestUrl(
        {
            url: 'https://readwise.io/api/v2/highlights/' + rw_highlight_id + '/tags',
            contentType: 'application/json',
            headers: readwise_auth_header
        })

        console.log("Highlight Tags for " + rw_highlight_id + ": " + JSON.stringify(highlight_tags.json));

        return highlight_tags.json
    }

    /// Send a tag delete request to the Readwise API
    /// This endpoint does not take any data, so you can
    /// only delete one tag_id per request.
    async function removeTagRequest(rw_highlight_id, tag_id)
    {
        const response = await request(
        {
            url: 'https://readwise.io/api/v2/highlights/' + rw_highlight_id + '/tags/' + tag_id,
            method: 'DELETE',
            contentType: 'application/json',
            headers: readwise_auth_header
        })
    }

    /// Send an "add tag" request to the Readwise API
    /// This endpoint appears to only allow one tag to be specified
    /// in the payload at a time.
    async function addTagRequest(rw_highlight_id, tag_name)
    {
        const response = await request(
        {
            url: 'https://readwise.io/api/v2/highlights/' + rw_highlight_id + '/tags',
            method: 'POST',
            contentType: 'application/json',
            headers: readwise_auth_header,
            body: JSON.stringify({"name": tag_name})
        })
    }

    /// This function removes the specified tags (if set) from the target highlight.
    /// tags_to_remove can be specified as a single value tag name,
    /// or it can be an array of tag names.
    ///
    /// To remove the tag, we need to perform a lookup on the highlight so we
    /// can get the numerical tag ID associated with that name.
    async function removeHighlightTags(rw_highlight_id, tags_to_remove)
    {
        tags_for_highlight = await getHighlightTagsRequest(rw_highlight_id);

        // We can only remove tags if there are some to begin with
        if (tags_for_highlight.count)
        {
            // The tag API only allows single-tag removal,
            // so we need to iterate over the list and remove one at a time
            for(var remove_tag_name of tags_to_remove)
            {
                let id_to_remove = null;

                // We'll look up the tag name in the highlight return value
                // to find the proper ID for use with the API
                for(var tag of tags_for_highlight.results)
                {
                    // If we've found a match, remove
                    if(tag.name == remove_tag_name)
                    {
                        id_to_remove = tag.id;
                        break;
                    }
                }

                if(id_to_remove)
                {
                    removeTagRequest(rw_highlight_id, id_to_remove);
                }
                else
                {
                    console.warn("[Readwise Tag Remove] Highlight ID " + rw_highlight_id + " does not contain the tag " + tag_name);
                }
            }

        }
        else
        {
            console.warn("[Readwise Tag Remove] highlight id " + rw_highlight_id + " has no tags");
        }
    }

    /********************
    * Button Processing *
    ********************/

    function bttnUpdate(row) {
        return createButton({app, el: dv.container,
            args:          { name: "X", class: "rwbttn" },
            clickOverride: { click: async (rowid)=> {
                // First, we need to note that this block has been processed
                app.vault.append(lgTFile,`${rowid}\n`)

                // Next, we need to handle any tags we want to modify

                if(OnProcessRemoveTags)
                {
                    console.log("Attempting to remove tag(s): " + OnProcessRemoveTags)
                    removeHighlightTags(rowid, OnProcessRemoveTags);
                }

                if(OnProcessAddTags)
                {
                    console.log("Attempting to add tag(s): " + OnProcessAddTags)

                    for(var tag of OnProcessAddTags)
                    {
                        addTagRequest(rowid, tag);
                    }
                }

            }, params: [row.id] }
        })
    }

    function bttnCopyBlockRef(row, caption, copyAsAlias = false, ifAliasIncludeText = false) {
        return createButton({app, el: dv.container,
            args:          { name: caption, class: "rwbttn" },
            clickOverride: {
                click: (blockId, file)=>{
                    let ref = ""
                    let filename = dv.io.normalize(file.name).replace('.md', '')
                    if(copyAsAlias) {
                        if(ifAliasIncludeText)
                        {
                            ref = `[[${filename}#^${blockId}]]\n`;
                            ref += row.block;

                            if(FilterFromClipboardCopy)
                            {
                                ref = ref.replace(FilterFromClipboardCopy, '');
                            }
                        }
                        else {
                            ref = `[[${filename}#^${blockId}]]`
                        }
                    } else {
                        ref = `![[${filename}#^${blockId}]]`
                    }
                    navigator.clipboard.writeText( ref );
                    new Notice(`Copied to clipboard:\n${ref}`,5000)
                },
                params: [row.realId, row.file, row.block]
            }
        })
    }

    /***************
    * Data Display *
    ***************/

    //Table columns
    const tableColumnNames = ["Block","","","","",""]

    async function getData() {
        let rwBlocks = [];
        const fileList = input ? input : await dv.pages('"' + app.plugins.plugins["readwise-official"].settings.readwiseDir +'"')
        await Promise.all(fileList.map(async(file)=> {
            const tFile = app.vault.getAbstractFileByPath(file.file.path)
            const contents = await app.vault.cachedRead(tFile)
            const cachedContents = app.metadataCache.getCache(file.file.path);
            if(cachedContents.blocks) {
                Object.values(cachedContents.blocks).forEach(b=>{
                    const ID = b.id.replace(/\D/g,'');
                    if(!log.includes(ID)) {
                        // This translates from the Obsidian block format to the output format.
                        // The `block` field contains the actual string data we want to see.
                        let output = {
                            id: ID, realId: b.id, file: tFile,
                            block: contents.substring(b.position.start.offset, b.position.end.offset).replace("- ","").replace(" ^" + b.id,"")
                        };

                        // First, check if we are filtering for a tag.
                        // If not, we'll enter
                        // if so, we'll only enter if a desired tag is found (logical OR)
                        if(!filterTags || filterTags.find(test => output.block.includes('#' + test)))
                        {
                            // next, we need to audit the exclude list
                            // If it's not set, we'll enter
                            // If it is set, we'll only enter if no excludes are found
                            //
                            // Alternate single tag version: output.block.includes('#' + filterTagsToExclude)
                            if(!filterTagsToExclude || !filterTagsToExclude.find(test => output.block.includes('#' + test)))
                            {
                                if(FilterFromQuoteDisplay)
                                {
                                    output.block = output.block.replace(FilterFromQuoteDisplay, '');
                                }
                                rwBlocks.push(output)
                            }
                        }
                    }
                })
            }
        }))

        const sortedRows = sortDateAscending ? rwBlocks.sort((a,b)=>a.id-b.id) :  rwBlocks.sort((a,b)=>b.id-a.id)
        let currentHighlightOutputCount = 0
        let lastHeader = ""
        let tableRows = []
        dv.header(1,"Readwise Inbox") 
        sortedRows.forEach(r=>{
            if(limitHighlightCount > currentHighlightOutputCount) {
                if(lastHeader != r.file.path) {
                    if(tableRows.length>0) {
                        dv.table(tableColumnNames, tableRows)
                        tableRows=[]
                    }
                    lastHeader = r.file.path
                    dv.header(2, dv.fileLink(r.file.path) )
                } 
                tableRows.push([ 
                    r.block, 
                    bttnUpdate(r),
                    bttnCopyBlockRef(r,"B",false,false), 
                    bttnCopyBlockRef(r,"A",true,false),
                    bttnCopyBlockRef(r,"T",true,true),
                    `[[${r.file.name}#^${r.realId}|+]] `, 
                ])
                currentHighlightOutputCount += 1    
            }
        })
        dv.table(tableColumnNames, tableRows)
    }
    return getData()
})()
