const express = require("express");
const app = express();
const PORT = 5000;
app.use(express.json());


app.listen(PORT, () =>{
    console.log(`Server is running on http://localhost:${PORT}`);
});

const videos = [];

//DEFAULT PAGE
app.get("/", (req,res) => {
    res.send("Welcome to soma na mimi");
});

app.get("/videos", (req, res) =>{
    res.json(videos);
});

//adding a video
app.post("/videos", (req,res) => {
    const {title, url} = req.body;

    if( !title||!url){
        return res.status(400).json({error : "Kindly fill in both required fields marked with *"});
    };

    const newVideo = {id : videos.length +1 , title, url};

    videos.push(newVideo);

    res.status(201).json(newVideo);
})

//deleting a video
app.delete("/videos/:id", (req,res) => {
    const videoID = parseInt(req.params.id);

    //check existence
    const videoIndex = videos.findIndex(video => video.id === videoID);
    if( videoIndex == -1){
        return res.status(404).json({error: "Video Not Found!"});
    };

    //proceed to delete

    videos.splice(videoIndex, 1);
    res.json({message: `Video of id ${videoID} has been deleted!`});
})
