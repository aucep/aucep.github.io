"use strict";

//this element contains the entire dynamic portion of the site, so it has to be unhidden
const contentPane = $("content-pane");
contentPane.style.display = ""; //aforementioned unhide

/*=================:
:      CONTENT     :
:=================*/

//pane to the right that shows the rendered content
//manipulated by chooserFiles options
const content = $("content");
//loads the content (duh)
content.load = async function(url) {
    //have to 
    if (!url.startsWith("https://")) {
        //from loadQueryPath, so url passed is 
        url = "https://raw.githubusercontent.com/aucep/written/main/" + url;
    } else {
        newHistory(
            url.replace("https://raw.githubusercontent.com/aucep/written/main/", "")
        );
    }

    content.textContent = "loading";

    const resp = await fetch(url);

    //world's shittiest error handling
    if (!resp.ok) {
        this.textContent = "failed";
        return;
    }

    this.raw = await resp.text();
    //have to clear the textContent because it doesn't disappear on its own
    content.textContent = "";

    const page = Parse.parseLang(this.raw, "12y");

    this.appendChild(page);
};


/*=================:
:      CHOOSER     :
:=================*/

//pane on the left for navigation
//manipulated by openDir, chooserDirs options
//fills openDir, chooserDirs, chooserFiles
const chooser = $("chooser");
//load path into chooser
chooser.load = async function(path, noHistory) {
    //push to history
    if (!noHistory) newHistory(path == "" ? "" : path + '/');

    const resp = await fetch(
        "https://api.github.com/repos/aucep/written/contents/" + path
    );

    //error handling (i wonder if this even catches anything)
    //still not worth using promise syntax
    if (!resp.ok) {
        chooserInfo.textContent = "could not load dir";
        return;
    }

    //to json
    const dirContents = await resp.json();

    //filter and fill
    const files = dirContents.filter((f) => f.type == "file");
    chooserFiles.populate(files);
    const dirs = dirContents.filter((f) => f.type == "dir");
    chooserDirs.populate(dirs);

    //update open-dir label
    if (path == "") {
        if (!openDir.classList.contains("root")) openDir.classList.add("root");
        openDirLabel.textContent = "(root)";
    } else {
        openDir.classList.remove("root");
        openDirLabel.textContent = path;
    }

    chooserInfo.textContent = "";
};

//shows which dir is currently open
const openDir = $("open-dir");
const openDirLabel = $('open-dir-label');

//shows loading errors
const chooserInfo = $("info");

//holds directory options
const chooserDirs = $("dirs");
chooserDirs.populate = Populator(chooserDirs, "dir-template", "no-dirs-template", "path");

//holds file options
const chooserFiles = $("files");
chooserFiles.populate = Populator(chooserFiles, "file-template", "no-files-template", "download_url");
chooserFiles.removeChosen = function() {
    this.querySelectorAll(".chosen")
        .forEach((o) => o.classList.remove("chosen"));
};

//creates a populate function
function Populator(el, templateId, noneTemplateId, pathAttr) {
    return function(options) {
        //clear current options
        removeChildrenOf(el);

        //no options check
        if (options.length == 0) {
            const template = $(noneTemplateId);
            const none = template.content.firstElementChild.cloneNode(true);
            el.append(none);
        } else {
            const template = $(templateId);
            options.forEach((o) => {
                //fill out the template
                const option = template.content.firstElementChild.cloneNode(true);
                option.lastElementChild.textContent = o.name;
                option.path = o[pathAttr];
                el.append(option);
            });
        }
    };
}

//to go back in browser history
window.onpopstate = loadQueryPath;

/*=================:
:    NAVIGATION    :
:=================*/
//nav functions attached to elements directly in the HTML

//attached to #open-dir
function loadParentDir() {
    let path = openDir.textContent.trim();
    if (path == "(root)") return;
    path = path.split("/");
    chooser.load(path.slice(0, path.length - 1).join("/"));
}

//attached to #dir-template > .option
function loadDir(e) {
    //i think o stands for 'option' but i'm not sure
    const o = e.currentTarget;
    const path = o.path;
    chooser.load(path);
}

//attached to #file-template > .option
function loadFile(e) {
    const o = e.currentTarget;

    //don't load something that's already loaded
    if (o.classList.contains("chosen")) return;

    content.load(o.path);

    //clear other .chosen and set this as .chosen
    chooserFiles.removeChosen();
    o.classList.add("chosen");
}


/*=================:
:  BROWSER HISTORY :
:=================*/

//load directory/file from querystring
async function loadQueryPath() {
    let query = location.search;
    if (query == "") chooser.load("", true);
    //empty... you disappoint me
    else {
        //now THAT's what i'm talking about!
        //remove ?/ or ? to get pure path
        query = query.replace(/\?\/|\?/, "");
        query = query.split("/");

        //load directory no matter what
        const path = query.length > 1 ? query.slice(0, query.length - 1).join("/") : "";
        await chooser.load(path, true);

        //if this is a file, load it
        const last = query[query.length - 1];
        if (last) {
            await content.load(query.join("/"));
            //update chosen
            chooserFiles.removeChosen();
            Array.from(chooserFiles.children).find((f) => f.lastElementChild.textContent == last).classList.add("chosen");
        }
        /*for (let file of chooserFiles.children) {
            if (
                file.lastElementChild.textContent == last
            ) {
                file.classList.add("chosen");
                break;
            }
        }*/
    }
}

//push a new history
function newHistory(path) {
    history.pushState(
        null,
        "",
        window.location.origin + window.location.pathname + "?/" + path
    );
}

/*=======:
:  MISC  :
:=======*/

function removeChildrenOf(el) {
    while (el.lastChild) el.removeChild(el.lastChild);
}

function print() {
    return console.log(...arguments)
}

function $(id) {
    return document.getElementById(id)
}

/*===============================:
: LET'S FUCKING GOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
:===============================*/
//finally page init
loadQueryPath();