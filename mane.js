"use strict";

const contentPane = $('content-pane');
contentPane.style.display = '';

const content = $("content");
content.load = async function (url) {
  content.innerText = "loading";
  const resp = await fetch(url);

  if (!resp.ok) {
    this.innerText = "failed: " + resp.statusText;
  }

  this.raw = await resp.text();
  content.innerText = "";

  const page = Parse.parseLang(this.raw, "12y");

  this.appendChild(page);
};

const chooserPathInput = $("path-input");
chooserPathInput.value = '';

const chooserInfo = $("info");

const chooserFiles = $("files");
chooserFiles.populate = function (files) {
  if (files.length == 0) this.textContent = "no files";
  else {
    while (this.lastChild) this.removeChild(this.lastChild);

    const template = $("file-template");

    files.forEach((f) => {
      const option = template.content.firstElementChild.cloneNode(true);
      option.lastElementChild.textContent = f.name;
      option.path = f.download_url;
      this.append(option);
    });
  }
};

function loadFile(e) {
  const o = e.currentTarget;
  if (o.classList.contains("chosen")) return;
  content.load(o.path);
  Array.from(o.parentNode.children).forEach((o) =>
    o.classList.remove("chosen")
  );
  o.classList.add("chosen");
}

const chooserDirs = $("dirs");
chooserDirs.populate = function (dirs) {
  if (dirs.length == 0) this.textContent = "no dirs";
  else {
    while (this.lastChild) this.removeChild(this.lastChild);

    const template = $("dir-template");

    dirs.forEach((d) => {
      const option = template.content.firstElementChild.cloneNode(true);
      option.lastElementChild.textContent = d.name;
      option.path = d.path;
      this.append(option);
    });
  }
};

function loadDir(e) {
  const o = e.currentTarget;
  let path;
  if (o.tagName == 'BUTTON') {
    path = chooserPathInput.value ?? '';
  } else {
    path = chooserPathInput.value = o.path;
  }
  chooser.load(path);
}

const openDir = $('open-dir');

const chooser = $("frame");
chooser.load = async function (path) {
  chooserInfo.textContent = "loading dir";

  const resp = await fetch(
    "https://api.github.com/repos/aucep/written/contents/" + path
  );
  if (!resp.ok) {
    chooserInfo.textContent = "could not load dir";
    return;
  }

  const dirContents = await resp.json();
  print(dirContents);
  const files = dirContents.filter((f) => f.type == "file");
  chooserFiles.populate(files);
  const dirs = dirContents.filter((f) => f.type == "dir");
  chooserDirs.populate(dirs);

  const openDirSpan = openDir.querySelector('span');
  if (path == "") {
    if (!openDir.classList.contains('root')) openDir.classList.add('root');
    openDirSpan.textContent = "(root)";
  } else {
    openDir.classList.remove('root');
    openDirSpan.textContent = path;
  }

  chooserInfo.textContent = "";
};

chooser.load('');

function loadParentDir() {
  let path = openDir.textContent;
  if (path == "(root)") return;
  path = path.split('/');
  chooser.load(path.slice(0,path.length-1));
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
