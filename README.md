# **Smart Filter**

SmartFilter lets you use multiple filtering in conjunction with pagination.

## **Instalation**

```bash
$ npm install git+https://git-clickqi:bfKGnknsGDkKdPu58sRp@bitbucket.org/ClickQI/clickqi-apps-smart-filter.git --save
```

or

```bash
$ yarn add git+https://git-clickqi:bfKGnknsGDkKdPu58sRp@bitbucket.org/ClickQI/clickqi-apps-smart-filter.git
```

## **Basic Usage**

### **HTML Structure**

To use in Category or Department Pages (an example):

### **Javascript Instantiation**

To use the SmartFilter plugin you must instantiate it in the running project.

```js
import { smartFilter } from "@ClickQi/clickqi-apps-smart-filter";
```

### **Invoke the Plugin**

After the package was imported invoke the plugin.

### **_Important_**: _For the correct functioning of the plugin, run it after loading the DOM, as in the example below._

```js
$(document).ready(function() {
    $(".your-conteiner-of-filters").smartFilter({ options });
});
```

### **Options**

| Property       | Value Type | Description                                                  |
| -------------- | ---------- | ------------------------------------------------------------ |
| `eraseCounter` | Boolean    | Remove amount of products in each filter. Default is `true`. |
| `shelfClass`   | String     | Set the class of shelves. Default is `.prateleira`.          |
| `callback`     | Function   | Callback when a shelf ajax request is completed.             |

## **Remove package**

```bash
$ npm uninstall @ClickQi/clickqi-apps-smart-filter
```

or

```bash
$ yarn remove @ClickQi/clickqi-apps-smart-filter
```
