console.log("lets write js!");
let songs;
let currentSong = new Audio();
let currentSongIndex = 0;
let currentFolder;

async function getSongs(folder)
{
    currentFolder = folder;
    let a = await fetch(`/songs/${folder}/`);
    let response = await a.text();
    console.log(response);
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for(let i=0;i<as.length;i++)
    {
        const element = as[i];
        if(element.href.endsWith(".mp3"))
        {
            songs.push(element.href);  // Store full URL, not just filename
        }
    }
    
    //show all songs in the playlist ul html
    let songul = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songul.innerHTML = ""; //clear previous songs
    for(const song of songs)
    {
        const decodedUrl = decodeURIComponent(song);  // Decode URL
        const songName = decodedUrl.split(/[\/\\]/).pop();  // Get filename (works with both / and \)
        songul.innerHTML = songul.innerHTML + ` <li>
                            <img class="invert" src="assets/music.svg" alt="music icon">
                            <div class="info">
                                <div>${songName}</div>
                                <div>Hitesh</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="assets/play.svg" alt="play icon">
                            </div>
                        </li>`;                
    }

    //Attach an event listener to each song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach((e, index)=>{
        e.addEventListener("click",element=>{
            console.log(e.querySelector(".info").firstElementChild.innerHTML)
            playMusic(e.querySelector(".info").firstElementChild.innerHTML, true, index);
        })
    });

    return songs;

}


function secondsToTime(seconds) {
    if(isNaN(seconds) || seconds < 0)
    {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(secs).padStart(2, '0');
    
    return `${formattedMinutes}:${formattedSeconds}`;
}

const playMusic = (track, shouldPlay = true, index) => {
    currentSongIndex = index;
    currentSong.src = `/songs//${currentFolder}/${track}`;
    if(shouldPlay)
    {   
        currentSong.play();
        play.src = "assets/pause.svg";  //play is id of the play button
    }
    document.querySelector(".songinfo").innerHTML = track;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    //need to wait for the metadata to load to get the duration
    currentSong.addEventListener("loadedmetadata", () => {
        document.querySelector(".songtime").innerHTML = "00:00 / " + secondsToTime(currentSong.duration);
    }, {once: true}); // {once: true} removes the listener after first use
}

async function displayAlbums() {
    let res = await fetch("/songs/");
    let text = await res.text();

    let div = document.createElement("div");
    div.innerHTML = text;

    let anchors = Array.from(div.getElementsByTagName("a"));
    let container = document.querySelector(".card-container");
    container.innerHTML = "";

    for (let a of anchors) {

        // only valid folders
        if (a.textContent.endsWith("/") && a.textContent !== "../" && !a.href.includes(".htaccess")) {

            let folder = a.textContent.replace("/", "").trim();

            try {
                let infoRes = await fetch(
                    `/songs/${folder}/info.json`
                );

                if (!infoRes.ok) continue;

                let data = await infoRes.json();

                container.innerHTML += `
                    <div data-folder="${folder}" class="card rounded">
                        <div class="play">
                            <img src="assets/play.svg">
                        </div>
                        <img id="playlist-img" src="/songs/${folder}/cover.jpg" alt="cover-image">
                        <h2>${data.title}</h2>
                        <p>${data.description}</p>
                    </div>
                `;
            } catch (err) {
                console.warn("Skipping folder:", folder);
            }
        }
    }

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            await getSongs(card.dataset.folder);
            playMusic(decodeURIComponent(songs[0]).split(/[\/\\]/).pop(), true, 0); //set the first song by default in the paused mode
        });
    });
}




async function main()
{
    //get the list of all the songs
    await getSongs("ncs");
    playMusic(decodeURIComponent(songs[0]).split(/[\/\\]/).pop(), false, 0); //set the first song by default in the paused mode
    console.log(songs)

    if(songs.length === 0) {
        console.log("No songs found!");
        return;
    }

    //Display albums
    await displayAlbums();

    //Attach event listeners to the control buttons
    //since the buttons have ids we can directly use the id name
    play.addEventListener("click",element=>{
        if(currentSong.paused)
        {
            currentSong.play();
            play.src = "assets/pause.svg";
        }
        else
        {
            currentSong.pause();
            play.src = "assets/play.svg";
        }
    })

    //Listen for timeupdate event.
    currentSong.addEventListener("timeupdate", ()=>{
        document.querySelector(".songtime").innerHTML = `${secondsToTime(currentSong.currentTime)} / ${secondsToTime(currentSong.duration)}`;

        //updating the seekbar
        let circle = document.querySelector(".circle");
        let progresspercent = (currentSong.currentTime / currentSong.duration) * 100;
        circle.style.left = `${progresspercent}%`;
    })

    //Add event listener to seekbar click
    document.querySelector(".seekbar").addEventListener("click", (e) =>{
        console.log("seekbar clicked");
        console.log("offsetx: ", e.offsetX, "width: ", e.target.getBoundingClientRect().width);
        
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        currentSong.currentTime = (percent / 100) * currentSong.duration;
    })

    //Add event listener to hamburger menu
    document.querySelector(".hamburger").addEventListener("click", ()=>{
        document.querySelector(".left").style.left = "0";
        document.querySelector(".hamburger").style.display = "none";
    })

    //Add event listener to close button
    document.querySelector(".close-btn").addEventListener("click", ()=>{
        console.log("close button clicked");
        document.querySelector(".left").style.left = "-120%";
        document.querySelector(".hamburger").style.display = "block";
    })

    //Add event listener to previous
    previous.addEventListener("click", ()=>{
        console.log("previous clicked");
        if(currentSongIndex > 0){
            currentSongIndex--;
            playMusic(decodeURIComponent(songs[currentSongIndex]).split(/[\/\\]/).pop(), true, currentSongIndex);
        }
    })

    //Add event listener to next
    next.addEventListener("click", ()=>{
        console.log("next clicked");
        if(currentSongIndex < songs.length - 1){
            currentSongIndex++;
            playMusic(decodeURIComponent(songs[currentSongIndex]).split(/[\/\\]/).pop(), true, currentSongIndex);
        }
    });

    //Add event listener to volumeslider
    document.querySelector(".volumeslider").getElementsByTagName("input")[0].addEventListener("change", (e)=>{
        console.log("volume changed to: ", e.target.value);
        currentSong.volume = e.target.value / 100;
        if(currentSong.volume > 0){
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg");
        }
    })

    // ...removed, now handled in displayAlbums()

    //Add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e=>{
        if(e.target.src.includes("volume.svg"))
        {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".volumeslider").getElementsByTagName("input")[0].value = 0;
        }
        else
        {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.10;
            document.querySelector(".volumeslider").getElementsByTagName("input")[0].value = 10;
        }
    })

} 

main();