// add-on title
var TITLE = 'Code Blocks';

// highlight.js config
var HLJS_DEFAULT_VERSION = '9.6.0';
var HLJS_CDNJS_URL = 'https://api.cdnjs.com/libraries/highlight.js';
var HLJS_CDN_URL_PRE = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/';
var HLJS_GH_BUILD_URL = 'https://api.github.com/repos/highlightjs/cdn-release/contents/build';
//var HLJS_GH_LANGUAGES_URL = HLJS_GH_BUILD_URL + '/languages';
var HLJS_GH_THEMES_URL = HLJS_GH_BUILD_URL + '/styles?ref=master';
var THEME_DEFAULT = 'default';

// user preferences
var PROPERTY_LANGUAGE = 'language';
var PROPERTY_THEME = 'theme';
var PROPERTY_NO_BACKGROUND = 'no_background';

// cache config
var DEFAULT_TTL = 60; // todo: to 3600
var KEY_THEME_URLS = 'theme_urls';

// errors
var ERR_FAILED_TO_INSERT = "Can't to insert here.";
var ERR_GETTING_USER_PREFERENCES = "Couldn't get user preferences.";
var ERR_GETTING_THEMES = "Couldn't get themes.";

/**
 * @OnlyCurrentDoc
 *
 * The above comment directs Apps Script to limit the scope of file
 * access for this add-on. It specifies that this add-on will only
 * attempt to read or modify the files in which the add-on is used,
 * and not all of the user's files. The authorization request message
 * presented to users will reflect this limited scope.
 */
 
/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Start', 'showSidebar')
      .addToUi();
}

/**
 * Runs when the add-on is installed.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 */
function showSidebar() {
  var ui = HtmlService.createTemplateFromFile('sidebar').evaluate()
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle(TITLE)

  DocumentApp.getUi().showSidebar(ui);
}

// top-level
/**
 * Gets the stored user preferences, if they exist.
 *
 * @return {Object} The user's preferences, if they exist.
 */
function getPreferences() {
  try {
    var userProperties = PropertiesService.getUserProperties();
    return {
      language: userProperties.getProperty(PROPERTY_LANGUAGE),
      theme: userProperties.getProperty(PROPERTY_THEME),
      noBackground: userProperties.getProperty(PROPERTY_NO_BACKGROUND)
    };
  } catch (e) {
    logError(ERR_USER_PREFERENCES, e);
    throw ERR_GETTING_USER_PREFERENCES;
  }
}

// button function to get themes from cdnjs
function getThemes() {
  try {
    return getThemesHelper();
  } catch (e) {
    logError(ERR_GETTING_THEMES, e);
    throw ERR_GETTING_THEMES;
  }
}

// button function
function getPreferencesAndThemes() {
  return {
    themes: getThemes(),
    prefs: getPreferences()
  };
}

function getThemesHelper() {
  // try to get urls from cache
  var scriptCache = CacheService.getScriptCache();
  var themeUrls = scriptCache.get(KEY_THEME_URLS);
  if (themeUrls !== null) {
    // data in the cache must be stored as a string
    themeUrls = JSON.parse(themeUrls);
  } else {
    // try cdnjs
    try {
      themeUrls = getThemesFromCdnjs();
    } catch (e) {
      logError(ERR_GETTING_THEMES, e);
      // try github
      try {
        themeUrls = getThemesFromGh();
      } catch (e2) {
        logError(ERR_GETTING_THEMES, e2);
        throw ERR_GETTING_THEMES;
      }
    }
    
    // cache the theme urls
    scriptCache.put(KEY_THEME_URLS, JSON.stringify(themeUrls), DEFAULT_TTL);

    // cache each url individually for faster lookup
    scriptCache.putAll(themeUrls, DEFAULT_TTL + 10);
  }

  // cache default theme, because it contains the base css
  var defaultUrl = themeUrls[THEME_DEFAULT];
  if (defaultUrl !== undefined) {
    getThemeStyle(defaultUrl);
  }

  var themes = Object.keys(themeUrls);
  return themes;
}

function getThemesFromCdnjs() {
  var r = UrlFetchApp.fetch(HLJS_CDNJS_URL);
  var jsn = r.getContentText();
  var data = JSON.parse(jsn);

  var version = data.version;
  var assets = data.assets;
  var latest;
  var latest = data['assets'][0];
  for (var i = 1; i < assets.length; i++) {
    if (assets[i].version === version) {
      latest = assets[i];
      break;
    }
  }
  var files = latest.files;

  var themeUrls = {};
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    if (file.indexOf('styles/') === 0) {
      var theme = file.split('styles/').pop().split('.min.css').shift();
      if (theme !== undefined) {
        themeUrls[theme] = buildThemeUrl(theme, version);
      }
    }
  }
  
  return themeUrls;
}

function getThemesFromGh() {
  var r = UrlFetchApp.fetch(HLJS_GH_THEMES_URL);
  var jsn = r.getContentText();
  var data = JSON.parse(jsn);
  
  var result = {};
  for (var i = 0; i < data.length; i++) {
    var entry = data[i];
    if (entry.type === 'file' && entry.name !== undefined) {
      var theme = entry.name.split('.min.css').shift();
      // to function
      if (theme !== undefined) {
        result[theme] = buildThemeUrl(theme);
      }
    }
  }

  return result;
}

// top-level
/**
 * Gets the user-selected text and translates it from the origin language to the
 * destination language. The languages are notated by their two-letter short
 * form. For example, English is 'en', and Spanish is 'es'. The origin language
 * may be specified as an empty string to indicate that Google Translate should
 * auto-detect the language.
 *
 * @param {string} origin The two-letter short form for the origin language.
 * @param {string} dest The two-letter short form for the destination language.
 * @param {boolean} savePrefs Whether to save the origin and destination
 *     language preferences.
 * @return {Object} Object containing the original text and the result of the
 *     translation.
 */
function getSelectionAndThemeStyle(language, theme, noBackground) {
  // save user preferences
  var userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty(PROPERTY_LANGUAGE, language);
  userProperties.setProperty(PROPERTY_THEME, theme);
  userProperties.setProperty(PROPERTY_NO_BACKGROUND, noBackground);

  var result = {'css': ''};
  var scriptCache = CacheService.getScriptCache();

  // prepend default css for other themes
  var themeUrl;
  if (theme !== THEME_DEFAULT) {
    themeUrl = scriptCache.get(THEME_DEFAULT);
    if (themeUrl !== null) {
      Logger.log('default theme url: %s', themeUrl);
      result.css += getThemeStyle(themeUrl);
    }
  }
  themeUrl = scriptCache.get(theme);
  if (themeUrl !== null) {
    result.css = getThemeStyle(themeUrl);
  }

  var text = getSelectedText();
  selection = text.join('\n');
  result['selection'] = selection;
  Logger.log('selection:\n%s', selection);
  Logger.log('returning result:\n%s', result);

  return result;
}

// gets and caches theme style
function getThemeStyle(themeUrl) {
  Logger.log('getting theme from url: %s', themeUrl);

  var scriptCache = CacheService.getScriptCache();
//  var css = scriptCache.get(themeUrl);
  var css = null;
  if (css === null) {
    Logger.log('css not found in cache, fetching...');

    var r = UrlFetchApp.fetch(themeUrl);
    css = r.getContentText();
      
    // try to cache the css
    try {
      scriptCache.put(themeUrl, css);
      Logger.log('cached css for: ' + themeUrl);
    } catch (e) {
      logError('Failed to cache CSS', e);
    }
  } else {
    Logger.log('css found in cache');
  }

  return css;
}

// top-level
/**
 * Replaces the text of the current selection with the provided text, or
 * inserts text at the current cursor location. (There will always be either
 * a selection or a cursor.) If multiple elements are selected, only inserts the
 * translated text in the first element that can contain text and removes the
 * other elements.
 *
 * @param {string} html The HTML with which to replace the current selection.
 */
// todo: comment
function insertCode(html, noBackground) {
  try {
    return insertCodeHelper(html, noBackground);
  } catch (e) {
    logError(ERR_FAILED_TO_INSERT, e);
    throw ERR_FAILED_TO_INSERT;
  }
}

function insertCodeHelper(html, noBackground) {
  // save user preferences
  var userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty(properties.noBackground, noBackground);
  
  var selection = DocumentApp.getActiveDocument().getSelection();
  if (selection) {
    insertIntoSelection(selection, html, noBackground);
  } else {
    insertIntoCursor(html, noBackground);
  }
}

function buildThemeUrl(theme, version) {
  if (version === undefined) {
    version = HLJS_DEFAULT_VERSION;
  }
  return HLJS_CDN_URL_PRE + version + '/styles/' + theme + '.min.css';
}

// dummy method for button handlers
// for some reason, click-bound functions will violate sandbox rules
// unless passed through th server
function stub() {
}

// Helper function that puts external JS / CSS into the HTML file.
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function logError(msg, error) {
  Logger.log(msg + ': %s', error);
}
