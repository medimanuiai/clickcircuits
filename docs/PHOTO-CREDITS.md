# Kit part photos

The kit viewer on the home page and the kit list on the donate page use real photos of each part, cut out of their white backgrounds (`images/parts/*.webp`). They come from openly licensed sources, and the licences require credit, which the site shows under the viewer and on the donate page.

| File | Original | Author | Licence |
| --- | --- | --- | --- |
| `arduino.webp` | [Arduino Uno - R3.jpg](https://commons.wikimedia.org/wiki/File:Arduino_Uno_-_R3.jpg) | SparkFun Electronics | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| `bluetooth.webp` | [Bluetooth Mate Silver](https://www.flickr.com/photos/sparkfun/12311196585) | SparkFun Electronics | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| `joystick.webp` | [Thumb Joystick - Deluxe](https://www.flickr.com/photos/sparkfun/50379564422) | SparkFun Electronics | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| `led.webp` | [5mm Red LED.jpg](https://commons.wikimedia.org/wiki/File:5mm_Red_LED.jpg) | oomlout | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) |
| `resistor.webp` | [10 kiloohms 5% axial resistor.jpg](https://commons.wikimedia.org/wiki/File:10_kiloohms_5%25_axial_resistor.jpg) | oomlout | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) |
| `servo.webp` | [Micro servo.jpg](https://commons.wikimedia.org/wiki/File:Micro_servo.jpg) | oomlout | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) |
| `breadboard.webp` | [400 points breadboard.jpg](https://commons.wikimedia.org/wiki/File:400_points_breadboard.jpg) | oomlout | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) |
| `button.webp` | [BUTA-12-X-STAN-01.jpg](https://commons.wikimedia.org/wiki/File:BUTA-12-X-STAN-01_(16422918065).jpg) | oomlout | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) |
| `wires.webp` | [A few Jumper Wires.jpg](https://commons.wikimedia.org/wiki/File:A_few_Jumper_Wires.jpg) | oomlout | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) |

Changes made: background removed, cropped, resized, saved as WebP. The cut-out versions of the CC BY-SA photos are shared under the same CC BY-SA 2.0 licence.

The joystick and Bluetooth photos are close stand-ins: the kit uses a joystick module and an HC-05 style Bluetooth module that look a little different. Photos of the actual kit parts would be better. Shoot each part on a plain white background, cut it out, save it as `images/parts/<part>.webp`, and update its credit in `js/viewer3d.js` (the `PARTS` list) and in this table.
