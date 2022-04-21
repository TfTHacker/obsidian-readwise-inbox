// Readwise Inbox 
// More info: https://github.com/TfTHacker/obsidian-readwise-inbox
// version: 0.0.1

( async ()=>{
    const {createButton} = app.plugins.plugins["buttons"]
    //Config file values
    const configFile = dv.page("rw-inbox-config")
    let limitHighlightCount = configFile.hasOwnProperty("LimitHighlightCount") ? configFile.LimitHighlightCount : 20 //default to 20 highlights
    limitHighlightCount = dv.current().LimitHighlightCount ? dv.current().LimitHighlightCount : limitHighlightCount // pull if limit from current page
    limitHighlightCount = limitHighlightCount > 1000 ? 1000 : limitHighlightCount
    let sortDateAscending = configFile.hasOwnProperty("SortDateAscending") ? Boolean(configFile.SortDateAscending) : true //default to true 
    sortDateAscending = dv.current().hasOwnProperty("SortDateAscending") ? dv.current().SortDateAscending : sortDateAscending // pull if limit from current page
    //Log file
    const lgName = configFile.ReadwisePathLogProcessed;
    const lgTFile = await app.vault.getMarkdownFiles().find(e=>e.basename===lgName);
    let log = (await app.vault.cachedRead(lgTFile)).split("\n")
    //Table columns
    const tableColumnNames = ["Block","","","","",""]

    function bttnUpdate(row) {
        return createButton({app, el: dv.container, 
            args:          { name: "X", class: "rwbttn" }, 
            clickOverride: { click: (rowid)=>{
                app.vault.append(lgTFile,`\n${rowid}`)
            }, params: [row.id] }
        })
    }
    
    function bttnCopyBlockRef(row, caption, copyAsAlias = false, ifAliasIncludeText = false) {
        return createButton({app, el: dv.container, 
            args:          { name: caption, class: "rwbttn" }, 
            clickOverride: {
                click: (blockId, file)=>{
                    const asAlias = copyAsAlias===true ? "|*" : ""
                    const ref = `![[${dv.io.normalize(file.name)}#^${blockId}${asAlias}]]`
                    navigator.clipboard.writeText( ref );
                    new Notice(`Copied to clipboard:\n${ref}`,5000)
                }, 
                params: [row.realId, row.file]
            }
        })
    }
    
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
                        let output = {
                            id: ID, realId: b.id, file: tFile,
                            block: contents.substring(b.position.start.offset, b.position.end.offset).replace("- ","")
                        };
                        rwBlocks.push(output)
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