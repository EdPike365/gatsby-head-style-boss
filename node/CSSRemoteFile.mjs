import { existsSync, mkdirSync, writeFile as _writeFile } from "fs"
import { downloadStringFromURL } from "../utils/netUtils.mjs"
import { minifyCSSAsync } from "./CSSMinifier.mjs"
import { getLinkStylesDir, getLinkFilePath } from "./CSSNodeUtils.mjs"
import { writeCSSToCacheFile } from "./CSSLocalFile.mjs"

export const handleRemoteCSSHREF = async (styleConfig) => {
   
    // if remoteHREF AND you are a STYLE, we have to pull it down and cache it
    if(styleConfig.cacheRemoteCSS || styleConfig.componentType === "STYLE"){

        const linkStylesDir = getLinkStylesDir()
        if(!existsSync(linkStylesDir)){
          mkdirSync(linkStylesDir, {recursive: true}, err => { console.error(err)})
        }

        const cssString = await downloadStringFromURL(styleConfig.remoteHREF)
        //this will not be inlined
        //so put in static folder so will be in public folder, so link can load it

        if(styleConfig.minify){
    
            // result is a quasi promise returned by postCSS.
            // so I cant use full await because it does not resolve properly.
            // postcss docs https://postcss.org/api/#lazyresult
            await minifyCSSAsync(cssString).then(result => {
                const miniCSS = result.css
                console.info(`HSBNode: Cached locally. minifyCSS(): "${styleConfig.displayName}": css length before: ${cssString.length} after: ${miniCSS.length}`)
                writeFile(styleConfig, miniCSS)
            })
    
        }else{
            console.info(`HSBNode: Cached locally. ${styleConfig.displayName} will NOT be minified.`)
            writeFile(styleConfig, cssString)
        }
        
    }else{
        console.info(`HSBNode: ${styleConfig.displayName} remoteHREF = ${styleConfig.remoteHREF}. Not cacheing.`)
    }
}

const writeFile = (styleConfig, css) => {
    if(styleConfig.componentType === "STYLE"){
        //if its a STYLE, the file needs to be read in and inlined
        writeCSSToCacheFile(styleConfig, css)
    }else{
        //if its a LINK, the file will be linked to so in the "public" folder somewhere
        writeCSSFileToPublicFolder(styleConfig, css)
    }
}

const writeCSSFileToPublicFolder = (styleConfig, cssString) => {
    
    const filePath = getLinkFilePath(styleConfig)

    _writeFile(filePath, cssString, err => {
        if (err) {
            console.error(err)
            return
        }
    })

}

