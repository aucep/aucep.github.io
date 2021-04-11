'use strict';

const content = $('content');
content.load = async function (filename) {
  content.innerText = 'loading';
  const resp = await fetch('/written/'+filename);

  if (!resp.ok) {
    this.innerText = 'failed: '+resp.statusText;
  }

  this.raw = await resp.text();
  content.innerText = '';
  
  const page = Parse.parseLang(this.raw, '12y');

  this.appendChild(page);
};


const chooser = $('chooser');
chooser.load = async function() {
  loadButton.disabled = true;
  this.disabled = true;
  Array.from(this.children).forEach(o => o.remove());
  const loading = document.createElement('option');
  loading.textContent = 'loading';
  this.appendChild(loading);

  const resp = await fetch('https://api.github.com/repos/aucep/written/contents');
  if (!resp.ok) {
    this.firstElementChild.textContent = 'could not load';
    return
  }

  const files = await resp.json();
  if (files.length == 0) {
    this.firstElementChild.textContent = 'no files!';
    return
  }

  Array.from(this.children).forEach(o => o.remove());
  files.forEach(f => {
    const option = document.createElement('option');
    option.textContent = option.value = f.name;
    this.appendChild(option);
  });
  this.disabled = false;
  loadButton.disabled = false;
}

const loadButton = $('load-button');
loadButton.onclick = () => content.load(chooser.value);

chooser.load();



function $(id) { return document.getElementById(id) }
//function $$(q) { return document.querySelector(q) }