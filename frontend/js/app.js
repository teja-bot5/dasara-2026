/* app.js: shared helpers, festival data, routing, nav menu, countdown */

var $=function(i){
  return document.getElementById(i);
};


/* --------------------------------
   Backend API
-------------------------------- */

var API="";


/* --------------------------------
   Decorative garland
-------------------------------- */

var g="<svg xmlns='http://www.w3.org/2000/svg' width='160' height='64'><path d='M0 12Q80 18 160 12' fill='none' stroke='%23744A2A' stroke-width='1.2'/><circle cx='5' cy='15.4' r='5.2' fill='%23E8861A'/><circle cx='15' cy='16.0' r='5.2' fill='%23F5B52E'/><circle cx='25' cy='16.6' r='5.2' fill='%23F2701A'/><circle cx='35' cy='17.1' r='5.2' fill='%23E8861A'/><circle cx='45' cy='17.4' r='5.2' fill='%23F5B52E'/><circle cx='55' cy='17.7' r='5.2' fill='%23F2701A'/><circle cx='65' cy='17.9' r='5.2' fill='%23E8861A'/><circle cx='75' cy='18.0' r='5.2' fill='%23F5B52E'/><circle cx='85' cy='18.0' fill='%23F2701A' r='5.2'/><circle cx='95' cy='17.9' r='5.2' fill='%23E8861A'/><circle cx='105' cy='17.7' r='5.2' fill='%23F5B52E'/><circle cx='115' cy='17.4' r='5.2' fill='%23F2701A'/><circle cx='125' cy='17.1' r='5.2' fill='%23E8861A'/><circle cx='135' cy='16.6' r='5.2' fill='%23F5B52E'/><circle cx='145' cy='16.0' r='5.2' fill='%23F2701A'/><circle cx='155' cy='15.4' r='5.2' fill='%23E8861A'/><g transform='translate(30 17) rotate(-26)'><path d='M0 0Q9 16 0 38Q-9 16 0 0' fill='%233E8E3C'/><path d='M0 2V34' stroke='%232A6A2A' stroke-width='1'/></g><g transform='translate(30 17)'><path d='M0 0Q9 16 0 38Q-9 16 0 0' fill='%233E8E3C'/><path d='M0 2V34' stroke='%232A6A2A' stroke-width='1'/></g><g transform='translate(30 17) rotate(26)'><path d='M0 0Q9 16 0 38Q-9 16 0 0' fill='%233E8E3C'/><path d='M0 2V34' stroke='%232A6A2A' stroke-width='1'/></g><circle cx='30' cy='17' r='8' fill='%23E8861A'/><circle cx='30' cy='17' r='3.5' fill='%23F5B52E'/><g transform='translate(110 17) rotate(-26)'><path d='M0 0Q9 16 0 38Q-9 16 0 0' fill='%233E8E3C'/><path d='M0 2V34' stroke='%232A6A2A' stroke-width='1'/></g><g transform='translate(110 17)'><path d='M0 0Q9 16 0 38Q-9 16 0 0' fill='%233E8E3C'/><path d='M0 2V34' stroke='%232A6A2A' stroke-width='1'/></g><g transform='translate(110 17) rotate(26)'><path d='M0 0Q9 16 0 38Q-9 16 0 0' fill='%233E8E3C'/><path d='M0 2V34' stroke='%232A6A2A' stroke-width='1'/></g><circle cx='110' cy='17' r='8' fill='%23E8861A'/><circle cx='110' cy='17' r='3.5' fill='%23F5B52E'/></svg>";

document.documentElement.style.setProperty(
  "--g",
  "url(\"data:image/svg+xml,"+g.replace(/"/g,"'")+"\")"
);


/* --------------------------------
   Festival data
-------------------------------- */

var CFG;
var EV;
var start;
var N;
var C;


/* --------------------------------
   Load festival data
-------------------------------- */

async function loadFestivalData(){

  try{

    var configResponse=await fetch(API+"/api/config");

    if(!configResponse.ok){
      throw new Error("Config request failed");
    }

    CFG=await configResponse.json();


    var eventsResponse=await fetch(API+"/api/events");

    if(!eventsResponse.ok){
      throw new Error("Events request failed");
    }

    EV=await eventsResponse.json();


    /* Festival start date */

    start=new Date(
      CFG.festival.startDate+"T00:00:00"
    );


    /* Event names */

    N=EV.map(function(e){
      return e.name;
    });


    /* Event colours */

    C=EV.map(function(e){

      if(Array.isArray(e.color)){
        return e.color;
      }

      return ["#FBE9C8","#D97A16"];

    });


    /* Start countdown */

    tick();


    /*
      events.js and pooja.js may already have
      loaded before API data arrived.
      Re-run their render functions now.
    */

    if(typeof renderEvents==="function"){
      renderEvents();
    }

    if(typeof slots==="function"){
      slots();
    }

    route();


  }catch(err){

    console.error("Festival data error:",err);

    /*
      Do not break the entire website.
      Keep the UI usable even if API temporarily fails.
    */

    start=new Date("2026-10-11T00:00:00");


    /* --------------------------------
       10 DAYS OF NAVARATRI
    -------------------------------- */

    N=[
      "Bala Tripura Sundari",
      "Gayatri",
      "Annapurna",
      "Lalita",
      "Saraswati",
      "Mahalakshmi",
      "Durga",
      "Mahishasuramardini",
      "Raja Rajeshwari",
      "Vijayadashami"
    ];


    /* --------------------------------
       10 DAY COLOURS
    -------------------------------- */

    C=[
      ["#FBE9C8","#D97A16"],
      ["#F8E0D8","#9D422D"],
      ["#E3EBCF","#5D7430"],
      ["#FBE3EA","#C2506E"],
      ["#EEF0F2","#8A94A0"],
      ["#FBEFC4","#D6A00F"],
      ["#F8D9D2","#B3322A"],
      ["#DCE9F2","#3F6F95"],
      ["#EBDDF2","#7B4B94"],
      ["#F6E3C3","#A04632"]
    ];


    tick();
    route();

  }

}


/* --------------------------------
   Routing
-------------------------------- */

function route(){

  var h=(location.hash||"#home").slice(1);

  if(!$(h)){
    h="home";
  }

  document.querySelectorAll("section").forEach(function(s){

    s.classList.toggle(
      "on",
      s.id===h
    );

  });


  document.querySelectorAll(".mn a").forEach(function(a){

    a.classList.toggle(
      "on",
      a.getAttribute("href")==="#"+h
    );

  });


  if($("mn") && $("mn").parentNode){
    $("mn").parentNode.classList.remove("open");
  }

  if($("mb")){
    $("mb").setAttribute(
      "aria-expanded",
      "false"
    );
  }


  window.scrollTo(0,0);


  if(
    h==="events" &&
    typeof obs==="function"
  ){
    obs();
  }

}


addEventListener(
  "hashchange",
  route
);


/* --------------------------------
   Mobile menu
-------------------------------- */

if($("mb")){

  $("mb").onclick=function(){

    var o=$("mn")
      .parentNode
      .classList
      .toggle("open");

    this.setAttribute(
      "aria-expanded",
      o
    );

  };

}


/* --------------------------------
   Countdown
-------------------------------- */

function tick(){

  if(!start || !$("count")){
    return;
  }

  var d=Math.max(
    0,
    start-new Date()
  );

  var D=Math.floor(
    d/864e5
  );

  var H=Math.floor(
    d/36e5
  )%24;

  var M=Math.floor(
    d/6e4
  )%60;


  $("count").innerHTML=[
    [D,"days"],
    [H,"hrs"],
    [M,"min"]
  ]
  .map(function(x){

    return "<div><b>"+
      x[0]+
      "</b><span>"+
      x[1]+
      "</span></div>";

  })
  .join("");

}


setInterval(
  tick,
  3e4
);


/* --------------------------------
   Date formatter
-------------------------------- */

function fmt(d){

  return d.toLocaleDateString(
    "en-IN",
    {
      weekday:"short",
      day:"numeric",
      month:"short"
    }
  );

}


/* --------------------------------
   Start
-------------------------------- */

document.addEventListener(
  "DOMContentLoaded",
  function(){

    route();
    loadFestivalData();

  }
);