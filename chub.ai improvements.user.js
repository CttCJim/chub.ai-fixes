// ==UserScript==
// @name         chub.ai improvements
// @namespace    http://tampermonkey.net/
// @version      2025-11-10-01
// @description  Convert tags in text to html, other improvements as needed
// @author       CttCJim
// @match        https://chub.ai/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chub.ai
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
//----------------------------------------------------
const verbose = false;
function randomString(length=8) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function toggle(id) {
  var x = document.getElementById(id);if(x.style.display === "none") {x.style.display = "block";} else {x.style.display = "none";}
}

function showHTML() { //javascript code to search for unparsed HTML in elements with style "overflow-wrap: break-word;" and parse it
    var nodes = document.querySelectorAll('[style*="overflow-wrap: break-word;"]');
    for(var i=0;i<nodes.length;i++) {//for each text field found
        var changed = false;
        var originalHTML = nodes[i].innerHTML;
        var divname;
        var rstr;
        var imgTag;
        //----------------------------------------------------------------------------//
        //search the node for unparsed html and parse it
        //this would be much simpler of a solution! But not as good.
        /*
            //REMOVED: This could leave the user open to malicious code, although no more so than any other website.
            if(originalHTML.indexOf('&lt;')>-1) {
                originalHTML = originalHTML.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
                changed=true;
            }*/
        if(verbose) {console.log("Parsing node " + i + " for unparsed <br> tags.");}
        {//search the node for unparsed <br> tags and parse them
            if(originalHTML.indexOf('&lt;br&gt;')>-1) {
                originalHTML = originalHTML.replace(/&lt;br&gt;/g,'<br>');
                changed=true;
            }
        }
        if (verbose) {console.log("Parsing node " + i + " for unparsed <p> tags.");}
        {//search the node for unparsed <p> tags and parse them
            while(originalHTML.indexOf('&lt;p')>-1) {
                var pStartPos = originalHTML.indexOf('&lt;p');
                var pEndPos = originalHTML.indexOf('&lt;/p&gt;', pStartPos);
                //replace <p ... > with p tag
                while(pStartPos>-1 && pEndPos>-1) {
                    //get the full p tag, assuming there could be anything between <p and >
                    var fullPTagEncoded = originalHTML.substring(pStartPos, originalHTML.indexOf('&gt;', pStartPos)+4);
                    var fullPTagDecoded = fullPTagEncoded.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                    originalHTML = originalHTML.replace(fullPTagEncoded, fullPTagDecoded);
                    //replace teh </p> at pEndPos
                    originalHTML = originalHTML.replace('&lt;/p&gt;', '</p>');
                    //find the next <p> tag
                    pStartPos = originalHTML.indexOf('&lt;p&gt;', pEndPos);
                    pEndPos = originalHTML.indexOf('&lt;/p&gt;', pStartPos);
                    changed = true;
                }
            }
        }
        //----------------------------------------------------------------------------//
        {//search the node for unparsed <a> tags and parse them
            if (verbose) {console.log("Parsing node " + i + " for unparsed <a> tags.");}
            if(originalHTML.indexOf('&lt;a')>-1) {
                originalHTML = originalHTML.replace(/&lt;a/g,'<a').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
                changed=true;
            }
        }
        //----------------------------------------------------------------------------//
        {//search the node for unparsed <img> tags and parse them into expandable images
            if (verbose) {console.log("Parsing node " + i + " for unparsed <img> tags.");}
            while (originalHTML.indexOf('&lt;img')>-1) {
                var imgStart = originalHTML.indexOf('&lt;img');
                var imgEnd = originalHTML.indexOf('&gt;', imgStart);
                if (imgEnd == -1) {
                    break; // No closing tag found
                }
                var imgTagEncoded = originalHTML.substring(imgStart, imgEnd + 4); // +4 to include '&gt;'
                var imgTagDecoded = imgTagEncoded.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                rstr = randomString(12);
                divname = "imgdiv_" + rstr;
                imgTag = `
                    <button id="btnOut_${rstr}" class="ant-btn css-f6nzt4 ant-btn-default ant-btn-color-default ant-btn-variant-outlined mt-2" onclick="var x = document.getElementById('${divname}');x.style.display ='inline';this.style.display ='none';">[Toggle Image]</button>
                    <div id="${divname}" style="display:none;">
                        <button id="btnIn_${rstr}" class="ant-btn css-f6nzt4 ant-btn-default ant-btn-color-default ant-btn-variant-outlined mt-2" onclick="var x = document.getElementById('${divname}');x.style.display ='none';btnOut_${rstr}.style.display ='inline';">[Toggle Image]</button>
                        <br>
                        ${imgTagDecoded}
                    </div>
                `;
                originalHTML = originalHTML.replace(imgTagEncoded, imgTag);
                changed = true;
            }
        }
        //----------------------------------------------------------------------------//
        {   //search for the string "!["
            if (verbose) {console.log("Parsing node " + i + " for unparsed markdown images.");}
            while(originalHTML.indexOf('![')>-1) {
                //find the next () and get what's between the ()
                var closeAltstr = '](';
                var startIndex = originalHTML.indexOf(closeAltstr);
                if(startIndex==-1) {
                    closeAltstr = '] (';
                    startIndex = originalHTML.indexOf(closeAltstr);
                }
                if(startIndex==-1) {
                    continue; //no valid markdown image found
                }
                //between startIndex and the next ) is the image URL
                //endIndex is the index of the next )
                var endIndex = originalHTML.indexOf(')',startIndex);
                var content = originalHTML.substring(startIndex + closeAltstr.length, endIndex);
                //replace the markdown image with an <img> tag
                var altText = originalHTML.substring(originalHTML.indexOf('![')+2, originalHTML.indexOf(closeAltstr));
                rstr = randomString(12);
                divname = "imgdiv_" + rstr;
                imgTag = `
                    <button id="btnOut_${rstr}" class="ant-btn css-f6nzt4 ant-btn-default ant-btn-color-default ant-btn-variant-outlined mt-2" onclick="var x = document.getElementById('${divname}');x.style.display ='inline';this.style.display ='none';">[Toggle Image]</button>
                    <div id="${divname}" style="display:none;">
                        <button id="btnIn_${rstr}" class="ant-btn css-f6nzt4 ant-btn-default ant-btn-color-default ant-btn-variant-outlined mt-2" onclick="var x = document.getElementById('${divname}');x.style.display ='none';btnOut_${rstr}.style.display ='inline';">[Toggle Image]</button>
                        <br>
                        <img src="${content}" alt="${altText}" style="max-width: 100%; height: auto;">
                    </div>
                `;
                //replace all instances of the markdown image with the img tag
                var mdImgMarkdown = '![' + altText + closeAltstr + content + ')';
                originalHTML = originalHTML.split(mdImgMarkdown).join(imgTag);
                changed=true;
            }
            //----------------------------------------------------//
        }
        //if changes were made, update the node's innerHTML
        if(changed) {
            if (verbose) {console.log("updating HTML for node " + i);}
            nodes[i].innerHTML = originalHTML;
        } else {
            if (verbose) {console.log("No changes made to node " + i);}
        }
    }
}
//----------------------------------------------------
//Repeat once a second (1000ms). Adjust this if you prefer faster or slower. 100 should be fine but 1000 works well enough.
//Anything too fast will cause performance issues.
//setInterval(showHTML,1000);
//removing this - may be causing some looping issues and it's inefficient.
//unfortunately the text isnt loaded until the user expands it, so we need another way to trigger the parsing.
//Instead, we'll add a button to trigger the parsing when the user wants it.
//----------------------------------------------------
//Add a button to the page to toggle the HTML parsing
var btn = document.createElement("button"); 
btn.innerHTML = "Parse HTML";
btn.className = "ant-btn css-f6nzt4 ant-btn-default ant-btn-color-default ant-btn-variant-outlined mt-2";
btn.onclick = showHTML;
//add fixed btn to top right of page
btn.style.position = "fixed";
btn.style.top = "10px";
btn.style.right = "50px";
btn.style.zIndex = "9999";
document.body.appendChild(btn);
//----------------------------------------------------
//future code here for other functions as needed.
})();
