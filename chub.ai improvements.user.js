// ==UserScript==
// @name         chub.ai improvements
// @namespace    http://tampermonkey.net/
// @version      2025-10-31-02
// @description  Convert tags in text to html, other improvements as needed
// @author       CttCJim
// @match        https://chub.ai/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chub.ai
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
//----------------------------------------------------
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
    //var nodes = document.querySelectorAll('[style*="overflow-wrap: break-word;"]');
    var nodes = document.querySelectorAll('.ant-collapse-content-box');
    for(var i=0;i<nodes.length;i++) {   //for each text field found
        var changed = false;
        var originalHTML = nodes[i].innerHTML;
        var divname;
        var rstr;
        var imgTag;
        //----------------------------------------------------------------------------//
        {   //search the node for unparsed html and parse it
            //this would be much simpler of a solution! But not as good.
            /*
            //REMOVED: This could leave the user open to malicious code, although no more so than any other website.
            if(originalHTML.indexOf('&lt;')>-1) {
                originalHTML = originalHTML.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
                changed=true;
            }*/
        }
        {   //search the node for unparsed <br> tags and parse them
            if(originalHTML.indexOf('&lt;br&gt;')>-1) {
                originalHTML = originalHTML.replace(/&lt;br&gt;/g,'<br>');
                changed=true;
            }
        }
        {   //search the node for unparsed <p> tags and parse them
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
        {   //search the node for unparsed <a> tags and parse them
            if(originalHTML.indexOf('&lt;a')>-1) {
                originalHTML = originalHTML.replace(/&lt;a/g,'<a').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
                changed=true;
            }
        }
        //----------------------------------------------------------------------------//
        {
            //search the node for unparsed <video> tags and parse them
            while (originalHTML.indexOf('&lt;video')>-1) {
                var videoStart = originalHTML.indexOf('&lt;video');
                var videoEnd = originalHTML.indexOf('&lt;/video', videoStart);
                console.log("videoStart: " + videoStart + ", videoEnd: " + videoEnd);
                if (videoEnd == -1) {
                    break; // No closing tag found
                }
                var videoTagEncoded = originalHTML.substring(videoStart, videoEnd + 14); // +14 to include '&lt;/video&gt;'
                //find all source tags within the video tag
                var sourceTags = [];
                var tempVideoTagEncoded = videoTagEncoded; //temporary variable to avoid infinite loop
                while (tempVideoTagEncoded.indexOf('&lt;source')>-1) {
                    var sourceStart = tempVideoTagEncoded.indexOf('&lt;source');
                    var sourceEnd = tempVideoTagEncoded.indexOf('&gt;', sourceStart);
                    if (sourceEnd == -1) {
                        break; // No closing tag found
                    }
                    var sourceTagEncoded = tempVideoTagEncoded.substring(sourceStart, sourceEnd + 4); // +4 to include '&gt;'
                    var sourceTagDecoded = sourceTagEncoded.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                    sourceTags.push(sourceTagDecoded);
                    //remove the source tag from the tempVideoTagEncoded to avoid infinite loop
                    tempVideoTagEncoded = tempVideoTagEncoded.replace(sourceTagEncoded, '');
                }

                console.log("videoTagEncoded: " + videoTagEncoded);
                var videoTagDecoded = videoTagEncoded.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                //remove everything inside the <video> tag except the opening and closing tags
                var videoTagOpenEnd = videoTagDecoded.indexOf('>') + 1;
                var videoTagCloseStart = videoTagDecoded.lastIndexOf('</video>');
                videoTagDecoded = videoTagDecoded.substring(0, videoTagOpenEnd) + videoTagDecoded.substring(videoTagCloseStart);
                console.log("videoTagDecoded: " + videoTagDecoded);
                //rebuild the video tag with the source tags included
                var sourcesCombined = sourceTags.join('\n');
                console.log("sourcesCombined: " + sourcesCombined);
                videoTagDecoded = videoTagDecoded.replace('</video>', sourcesCombined + '\n</video>');
                console.log("Final videoTagDecoded: " + videoTagDecoded);
                //create the toggleable div
                rstr = randomString(12);
                divname = "videodiv_" + rstr;
                var videoTag = `
                    <button id="btnOut_${rstr}" class="ant-btn css-f6nzt4 ant-btn-default ant-btn-color-default ant-btn-variant-outlined mt-2" onclick="var x = document.getElementById('${divname}');x.style.display ='inline';this.style.display ='none';">[Toggle Video]</button>
                    <div id="${divname}" style="display:none;">
                        <button id="btnIn_${rstr}" class="ant-btn css-f6nzt4 ant-btn-default ant-btn-color-default ant-btn-variant-outlined mt-2" onclick="var x = document.getElementById('${divname}');x.style.display ='none';btnOut_${rstr}.style.display ='inline';">[Toggle Video]</button>
                        <br>
                        ${videoTagDecoded}
                    </div>
                `;
                originalHTML = originalHTML.replace(videoTagEncoded, videoTag);
                changed = true;
            }
        }
        //----------------------------------------------------------------------------//
        {   //search the node for unparsed <img> tags and parse them into expandable images
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
            nodes[i].innerHTML = originalHTML;
        }
    }
}
//----------------------------------------------------
//Repeat once a second (1000ms). Adjust this if you prefer faster or slower. 100 should be fine but 1000 works well enough.
//Anything too fast will cause performance issues.
setInterval(showHTML,1000);
//----------------------------------------------------
//future code here for other functions as needed.

})();
