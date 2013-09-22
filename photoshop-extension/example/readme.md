# Photoshop & Illustrator to createjs
Example for getting vector art in createjs as spritesheets.

## In Illustrator or Photoshop

* Create a top layer for each obJect
* Create a sub layer for each animation
* Create frames under the animation layer, in illustartor make this a group even for single objects

## Using the sample
In this folder export the Sprite.ai in the sprites foler as a Photoshop document using File | Export and selecting Photoshop

Then in photoshop export to createjs using the script to the sprites folder.

Then you should be able to see the animations by opening index.html in a browser.

## Setting configuration information
By adding certain decorations to animation layer names you can help generate a better script.

### Marking a frame as common
To mark a frames as common for the animation prepend the name with a +
Placing a common frame at the top of the frame list it will be on top of all the other frames
Placing a common frame at the bottom of the list it will be drawn below all other frames

A common frame that is below some frames, and above others it will draw behind all frames above it, but on top of all frames below it.

See the green ball example sprite.

You can have more than one common frame

### Setting the animation frequency

To Set the animation frequency add a '@' with the frequency after the animation name

> roll@12

The animation roll will have a frequency of 12

### Setting the next animation

> roll>bounce

The animation roll's next animation is 'bounce'

See the Blue ball example


