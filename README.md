# idea

Create a simulated environment that consists of a drones playing a game. 
one drone tries to fly into an object, the other drone tries to protect the object and intercept the first drone. 

The protecting drone must identify the both the drone and the projected object, whereas the first drone must only identify the object. 

The questions I want to answer are:

1. How can I create a simulated environment that is easy to understand and modify?
2. Can I use OpenAI realtime multi-modal as a control system? or Groq multi-modal open source llama3?
3. What appens when I make the attacking drone smarter?

 
Decided to use three.js. React front, python backend.

## Setup

Assumes you have `pyenv`  installed.

    pyenv install 3.11-dev
    pyenv virtualenv 3.11-dev shielddrone
    pyenv activate
    pip install -r requirements.txt

    cd frontend
    npm install 
    npm run dev

## Tools considered

    https://github.com/CodexLabsLLC/Colosseum.git
 
 
Unsure whether to use Colosseum(Airsim), Parrot's Sphinx, or Nvida's Isaac Gym 
- Parrot open source but may require more setup on docker or a linux cloude and I wanted local https://developer.parrot.com/docs/sphinx/index.html


# features

defending drones have higher max speed but start at y=0. 
defending drones have complete situational awareness
defending drones arranged near projected objects, center

## TODO 

- direction arrow
- heat trail based on previous positions, bezier curve between them
- collision detection turn attacker to yellow, change size and stop, is_disabled state


- implement instantiation of drone positions based on strategy for each
- implement naive strategy for attacking drone


- implement AI strategy for defending drone
 

 add timestamp to drone history for replayability

more strategies based on starting hieght, near the defense object 