
document.getElementById("upload").addEventListener("input", ev =>{
    // listen for upload of files
    let target = ev.target;
    if (db){
        let files = target.files
        // save each file in db
        for (let file of files){
            save_file(file, file.type.split("/")[0], file.name);
        }
    }
});


document.getElementById("url-add").onclick = _=>{
    // download file from given url
    let linkField = document.getElementById("url-input"), nameField = document.getElementById("url-name");
    
    let getVal = field => field.value;
    
    let link = getVal(linkField), name = getVal(nameField);
    
    name = name ?? "download_" + new Date().toUTCString().replaceAll(" ","_");
    if (link){
        fetch(link)
        .then(res => res.blob())
        .then(res => {
            // reset and save downloaded file
            linkField.value = nameField.value = "";
            save_file(res, res.type.split("/")[0], name);
        
        }).catch(err => alert("The given URL is invalid"))
    }
}


document.querySelectorAll("nav a")?.forEach?.(element => {
    element.onclick = ev =>{
        // change tabs
        ev.preventDefault();
        
        document.querySelector("nav a.active").classList.remove("active");
        let section = document.getElementById(`${element.getAttribute("href").slice(1)}`);
        let newLeft = section.offsetLeft;
        document.title = "Files: "+section.getAttribute("data-section");
        document.getElementById("full-slide").style.left = -newLeft + "px";
        element.classList.add("active");
    }
})


document.getElementById("full-slide").addEventListener("touchstart", touchstart = ev =>{
    
    let touchX = ev.changedTouches[0].clientX;
    let target = document.getElementById("full-slide");
    target.classList.add("no-trans");
    
    if (!target.style.left) target.style.left = "0px";
    
    let initLeft = parseInt(target.style.left);
    let scrollableWidth = target.offsetWidth * 0.8;
    let sectWidth = scrollableWidth/4;
    
    document.addEventListener('touchend', touchend = ev =>{
        target.classList.remove("no-trans");
        let finalLeft = ev.changedTouches[0].clientX;
        let diff = finalLeft - touchX;
        let curLeft = parseInt(target.style.left);
        
        target.style.left = Math.abs(diff) > 50 && curLeft != initLeft? 
            diff > 0? initLeft + sectWidth + "px" : initLeft - sectWidth + "px"
        : 
            initLeft + "px";
        
        
        let quo = Math.round( parseInt(target.style.left)/ sectWidth );
        quo = quo === Infinity? 0 : Math.abs(quo);
        document.querySelector("nav a.active").classList.remove("active");
        document.querySelectorAll("nav a")[quo].classList.add("active");
        
        document.removeEventListener('touchmove', touchmove);
    }, {once: true});

    
    document.addEventListener('touchmove', touchmove = ev =>{
        let displacement = ev.changedTouches[0].clientX - touchX;
        // displacement is + ltr, -rtl
        
        if (initLeft == 0 && displacement > 0 || initLeft <= -scrollableWidth && displacement < 0){
            target.style.left = initLeft + "px";
        } else
            target.style.left = displacement + initLeft + "px";
    });
}, {passive: true});

// init db
let db;

const open_request = indexedDB.open("files_db");

open_request.onupgradeneeded = _=>{
    db = open_request.result;
    const files_tb = db.createObjectStore("files_table", {keyPath: "id", autoIncrement: true});
    files_tb.createIndex("type", "type", {unique: false});
}

open_request.onsuccess = ev =>{
    // assign db
    db = ev.target.result;
    
    db.transaction("files_table").objectStore("files_table")
    .openCursor().onsuccess = ev =>{
        cursor = ev.target.result;
        if (cursor){
            val = cursor.value;
            url = URL.createObjectURL(val.file);
            showfile(url, val.type, val.name);
            cursor.continue();
        }
    }
  
}

function save_file(blob, type, name){
    // strat read write trans
    files_table = db.transaction("files_table", "readwrite").objectStore("files_table");
    new_obj = {type, name, file: blob}
    // add to db
    files_table.put(new_obj);
    url = URL.createObjectURL(blob);
    // show on preview grid
    showfile(url, type, name);
}

function showfile(url,type,name){
    let file;
    let cont = document.createElement("div");
    cont.classList.add("grid-item");
    
    switch(type){
        case "image":
            file = document.createElement("img");
            file.src = url;
            file.classList.add("image-item");
            file.alt = "Not available";
            file.style = "height: 100%; width:100%";
            cont.appendChild(file);
            document.getElementById("img-slide").prepend(cont);
            break;
        case "video":
            file = document.createElement("video");
            file.src = url;
            file.style = "height: 100%; width:100%";
            file.classList.add("video-item");
            file.nodeValue = "Not supported";
            cont.appendChild(file);
            document.getElementById("vid-slide").prepend(cont);
            break;
        case "audio":
            file = document.createElement("audio");
            file.src = url;
            file.classList.add("audio-item");
            file.nodeValue = "Not supported";
            cont.appendChild(file);
            document.getElementById("aud-slide").prepend(cont);
            break;
        default:
            file = document.createElement("div");
            file.classList.add("other-item");
            cont.appendChild(file);
            document.getElementById("other-slide").prepend(cont);
      }
    cont = cont.cloneNode("true");
    document.getElementById("all-slide").prepend(cont);
}


document.getElementsByClassName("url-form")[0].addEventListener('click', ev => ev.stopPropagation());

function showURLOverlay(){
    let target = document.getElementsByClassName("url-overlay")[0];
    target.style.display = "block";
    
    document.getElementsByClassName("close-btn")[0].onclick = target.onclick = _ =>{
        target.style.display = "none";
    }
}
