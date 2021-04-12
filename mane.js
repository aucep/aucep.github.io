"use strict";

//just to unhide (prettier for no-js error msg)
const contentPane = $("content-pane");
contentPane.style.display = ""; //aforementioned unhide

//el shows the rendered content
const content = $("content");
//loads the content (duh)
content.load = async function (url) {
  //make sure this is a bona fide url
  if (!url.startsWith('https://')) url = "https://raw.githubusercontent.com/aucep/written/main/"+url;

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

//el for fast nav if you know the path
const chooserPathInput = $("path-input");
chooserPathInput.value = "";

//go up one, if possible
function loadParentDir() {
  let path = openDir.textContent;
  if (path.trim() == "(root)") return;
  path = path.split("/");
  chooser.load(path.slice(0, path.length - 1));
}

//el shows errors for loading
const chooserInfo = $("info");

//el holds the files in chooser
const chooserFiles = $("files");
//fill the el with clickable options
chooserFiles.populate = function (files) {
  //no files check
  if (files.length == 0) this.textContent = "no files";
  else {
    //hey! there's files.
    //clear current files
    while (this.lastChild) this.removeChild(this.lastChild);

    const template = $("file-template");

    files.forEach((f) => {
      //fill out the template
      const option = template.content.firstElementChild.cloneNode(true);
      option.lastElementChild.textContent = f.name;
      option.path = f.download_url;
      this.append(option);
    });
  }
};
//load the file into the content el
function loadFile(e) {
  //i think o stands for 'option' but i'm not sure
  const o = e.currentTarget;

  //don't load something that's already loaded
  if (o.classList.contains("chosen")) return;

  //load
  content.load(o.path);

  //clear other chosen and set this as chosen
  Array.from(o.parentNode.children).forEach((o) =>
    o.classList.remove("chosen")
  );
  o.classList.add("chosen");
}

//el holds the directories in chooser
const chooserDirs = $("dirs");
//fill the el with clickable options
chooserDirs.populate = function (dirs) {
  //no dirs check
  if (dirs.length == 0) this.textContent = "no dirs";
  else {
    //wow... dirs... what a surprise
    //clear out current dirs
    while (this.lastChild) this.removeChild(this.lastChild);

    const template = $("dir-template");

    dirs.forEach((d) => {
      //fill out template
      const option = template.content.firstElementChild.cloneNode(true);
      option.lastElementChild.textContent = d.name;
      option.path = d.path;
      this.append(option);
    });
  }
};

//load the directory into the chooser
function loadDir(e) {
  //same o same o
  const o = e.currentTarget;
  const path =
    o.tagName == "BUTTON"
      ? chooserPathInput.value ?? "" //YEAH WE COULD BE COMING FROM THE NAV BUTTON
      : (chooserPathInput.value = o.path); //or just from a directory option ;w;
  chooser.load(path);
}

//el shows which dir is currently open
const openDir = $("open-dir");

//el holds the directories and files
const chooser = $("frame");
chooser.load = async function (path) {
  //chooserInfo.textContent = "loading dir";
  //removed this because it was just annoying

  const resp = await fetch(
    "https://api.github.com/repos/aucep/written/contents/" + path
  );

  //error yadda yadda (i wonder if this even catches anything)
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

  //update open-dir span
  const openDirSpan = openDir.querySelector("span");
  if (path == "") {
    if (!openDir.classList.contains("root")) openDir.classList.add("root");
    openDirSpan.textContent = "(root)";
  } else {
    openDir.classList.remove("root");
    openDirSpan.textContent = path;
  }

  //clear any
  chooserInfo.textContent = "";
};

//handle query string
let query = window.location.search;
if (query == "") chooser.load("");//empty... you disappoint me
else {//now THAT's what i'm talking about!
  query = query.replace(/\?\/|\?/,'');
  query = query.split("/");
  const last = query[query.length - 1];
  if (last) content.load(query.join('/'));
  if (query.length > 1) chooser.load(query.slice(0,query.length-1).join('/'));
}

function print() {
  console.log(...arguments);
  return arguments;
}

function $(id) {
  return document.getElementById(id);
}
function $$(q) {
  return document.querySelector(q);
}
