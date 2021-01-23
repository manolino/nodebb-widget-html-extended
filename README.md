# NodeBB HTML Extended Widget

HTML enhanced widget with [**ACE Editor**](https://ace.c9.io/) and slider functionality through the [**bxSlider**](https://bxslider.com/) plugin.

![](https://github.com/manolino/nodebb-widget-html-extended/blob/master/public/images/screenshot_6.png)

### Features

This widget lets you insert HTML blocks with slider functionality through JQuery bxSlider plugin (included). 
Widget administrative panel includes a *Settings* tab and three ACE Editor tabs: one for the HTML *Template*, one for *LESS* rules and properties, and the last for JSON *Data*.

*Data* tab appears only when *slider* is enabled. Data is maintained and saved even if it is not displayed.

![](https://github.com/manolino/nodebb-widget-html-extended/blob/master/public/images/screenshot_2.png)

### Benchpress and Autocompletion
[**Benchpress**](https://github.com/benchpressjs/benchpressjs) templating framework is enbled and will parse all contents. Autocompletion lists on *(ctrl+space)* or *{* key(left bracket).
Available objects and properties that appear in the list come from the context in which the widget is inserted (same data as *ajaxify.data*).

Data structure defined in the *Data* tab will appear too, with the meta *property*.

Predefined *{slides}* object contains the data array contained in the *Data* tab. *Data* must be valid JSON containing an array of objects

``` json
[
  {
    "title": "Take One",
    "description": "Learn and teach through making",
    "textColor": "#ff34d3",
    "users": 3,
  },
  {
    "title": "Take Two",
    "description": "free resources for everyone anywhere in the world",
    "textColor": "#ffd432",
    "users": 12,
  },
]

```
 or *one* of the following objects:

``` json
{
  "topics": [123, 456, 789, 1205, ]
}

{
  "categories": [12, 45, 78, ]
}

{
  "groups": ["JS Coders", "Makers", "Permaculture Educators", ]
}
```

![](https://github.com/manolino/nodebb-widget-html-extended/blob/master/public/images/screenshot_3.png)

### LESS Styles

CSS Styles are compiled from the supplied LESS and are optionally wrapped in a class, if any, specified in *CSS Class* setting.
Every widget has a unique identifier so you can have different stylings for each widget/slider. Check bxSlider documentation for customizations.

![](https://github.com/manolino/nodebb-widget-html-extended/blob/master/public/images/screenshot_5.png)

The widget comes also with margin and padding Bootstrap 4 classes adapted to Bootstrap 3. Includes also some useful styles from [**Froala Design Blocks**](https://froala.com/design-blocks/). So you can use over 170 responsive design blocks ready to be used in widgets.

![](https://github.com/manolino/nodebb-widget-html-extended/blob/master/public/images/screenshot_4.png)

## Installation

    npm install nodebb-widget-html-extended

Then head over to Admin -> Extend -> Widgets and place the widget. You will find some sample blocks added to global/drafts. Every time you activate this widget plugin, samples will be generated again.

![](https://github.com/manolino/nodebb-widget-html-extended/blob/master/public/images/screenshot_1.png)
