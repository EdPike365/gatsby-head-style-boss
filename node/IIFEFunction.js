
function HSBFunction() {

  console.log("Gatsby Head Style Boss: Flash Prevention Code is running.");
  const log = false; 
  // HSBModel is loaded by an IIFE that runs before the body loads. 
  // So it reflects the style links and elements that ACTUALLY got inserted on SSR, and their actual state.
  class HSBModel {

    constructor() {
      if(log)console.log("HSBModel constructor() running...");
      this.storageKey = "HeadStyleBossStyleKey";
      // We use datasets a lot: https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes

      // combo of style elements and style links
      this.managedStyles = this.getManagedStylesFromPage();
      // preloaded for speed
      this.optionalStyles = this.managedStyles.filter( style => !(style.dataset.hsbAlwaysEnabled === "true") );
      this.darkStyles = this.managedStyles.filter( style => style.dataset.hsbUses.includes("dark") )
      
      this.darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
      // If you use the arrow function, "this" will be the real this,
      // and not the media query list's "this".
      this.darkQuery.addEventListener("change", evt => this.handleDarkQueryChange(evt) );
      
      this.enableInitialStyle();
      if(log)console.log("HSBModel constructor() done!");
    }

    isUsingADarkStyle(){
      return (this.darkStyles.filter( style => style.disabled == false ).length > 0)
    }

    toggleDarkStyle(){
      if(this.isUsingADarkStyle()){
        const style = this.getLightOrDefaultOrAnyOptionalStyle();
        if(style) this.setAndSaveStyle(style) 
      }else{
        this.setStyleByUse("dark")
      }
    }

    setStyleByUse = function (styleUse) {
      const style = this.getLastStyleWithUse(styleUse)
      if (style) {
        this.setAndSaveStyle(style)
      } 
    }

    // Used by style selector component
    setStyleByKey = function (keyVal) {
      const style = this.getStyleForKey(this.managedStyles, keyVal)
      if (style) {
        this.setAndSaveStyle(style)
      }
    }

    // The HSB_Context code will have a listener mapped here.
    // It update the context every time the model changes.
    modelStateChanged = () => {   
      //check it out! 
    }
           
    getManagedStylesFromPage = () => {
      var styleNodes = document.querySelectorAll( "[data-hsb-managed*='true']" )
      var arr = Array.from(styleNodes)
      if(log)console.log("Found num HSB managed styles: " + arr.length )
      return arr
    }

    enableInitialStyle = () => {
      let style = this.getStyleForStoredStyleKey()
      if(!style){
        style = this.getStyleForDarkQueryState()
      }
      if (!style) {
        if(log)console.log(
          "enableInitialStyle(): Could not get style for stored key or dark mode. Setting to use default."
        )
        style = this.getLastStyleWithUse("default")
      }
      this.setAndSaveStyle(style)
    }

    handleDarkQueryChange = (evt) => {
      if(log)console.log(
        "darkQueryListener: prefers-color-scheme just changed, wants dark = " +
          evt.matches
      )
      let style = this.getStyleForDarkQueryState();
      this.setAndSaveStyle(style);
    }

    // This function should be the ONLY place that commits model changes after initiation.
    // If you do it somewhere else, remember to call HSB_Context modelStateChanged(this)
    setAndSaveStyle = (style) => {
      // final style=null failsafe,
      if(log)console.log("setAndSaveStyle() style: " + style.dataset.hsbDisplayname )
      if (style) {
        this.toggleEnabledStyles(this.optionalStyles, style)
        this.setStoredStyleKey(style.dataset.hsbKey)
        this.modelStateChanged(this) //Let the UI components know something changed
      } else {
        console.log("ERROR: HSBModel.setAndSaveStyle(): Someone tried to setAndSaveStyle to null. ")
      }
    }

    getStyleForDarkQueryState = () => {
      if (this.darkQuery.matches) {
        return this.getLastStyleWithUse("dark")
      } else {
        return this.getLightOrDefaultOrAnyOptionalStyle()
      }
    }

    toggleEnabledStyles = (styles, styleToEnable) => {
      const enableKey = styleToEnable.dataset.hsbKey
      styles.forEach( style => {
        if (style.dataset.hsbKey === enableKey) {
          style.disabled = false
        } else {
          style.disabled = true;
        }
      })
    }

    getLightOrDefaultOrAnyOptionalStyle(){
      let style = this.getLastStyleWithUse("light");
      if(!style) style = this.getLastStyleWithUse("default");
      if(!style) style = this.optionalStyles.slice(-1)[0];
      if(!style){
        if(log)console.log("WARNING: HSBModel getLightOrDefaultOrAnyOptionalStyle(): could not find any light, default or optional styles. Check you your config, you might only have a dark style.");
      } 
      return style;  
    }


    getLastStyleWithUse = function (useVal) {
      let results = this.getStylesWithUse(useVal)
      if (results.length > 0) {
        return results[results.length - 1]
      } else {
        return null
      }
    }

    getEnabledOptionalStyles = () => {
      return this.optionalStyles.filter( style =>  style.disabled == false )
    }
    
    getStylesWithUse = function (useVal) {
      return this.optionalStyles.filter( style => style.dataset.hsbUses.includes(useVal) )
    }

    getStyleForKey = (styles, key) => {
      const list = styles.filter( style => style.dataset.hsbKey === key )
      return list.length > 0 ? list[list.length -1] : null
    }

    getStyleForStoredStyleKey = () => {
      const styleKey = this.getStoredStyleKey()
      if(styleKey){
        return this.getStyleForKey(this.managedStyles, styleKey)
      }else{
        return null
      }
    }

    getStoredStyleKey = () => {
      var styleKey = null
      try {
        styleKey = localStorage.getItem(this.storageKey)
        if(log)console.log("getStoredStyleKey(): found stored styleKey " + styleKey)
      } catch (err) {
        console.log("ERROR: HSBModel getStoredStyleKey(): " + err)
      }
      return styleKey
    }

    setStoredStyleKey = (keyValue) => {
      try {
        localStorage.setItem(this.storageKey, keyValue)
      } catch (err) {
        console.log("ERROR: HSBModel setStoredStyleKey(): " + err)
      }
    }
  }

  const thisHSBModel = new HSBModel()
  window.__HSBModel = thisHSBModel
  
}

// This occurs here so if we import the function, it will not auto execute
// TODO test importing the function directly to make sure above is true
const getIIFE = () => {

  const functionString = String(HSBFunction)
  
  // Wrap it in an IIFE
  return `(${functionString})()`

}

module.exports = {
  getIIFE
}



