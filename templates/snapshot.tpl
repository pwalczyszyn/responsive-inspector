<!doctype html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
    <style type="text/css">
        body {
            margin:0;
            padding:0;
            height:100%;
            overflow:hidden;
            font: 20px verdana;
            background-image: url({{bg-pattern}}); background-position: initial initial; background-repeat: initial initial;
        }
        iframe {
            position:absolute;
            top:0;
            left:0;
            overflow:hidden;
            margin:0;
            padding:0;
            border:none;
        }
        #placehoder {
            position:absolute;
            display:table;
            height:100%;
            top:0;
            left:0;
            width:{{width}}px;
            background-color:#fff;
            box-shadow: 5px 0 20px 1px rgb(213, 213, 213);
        }
        #placehoder-content {
            display:table-cell;
            vertical-align:middle;
            text-align:center;
            padding:10px;
        }
    </style>
</head>
<body>

    <div id="placehoder"><div id="placehoder-content">Your page will load here shortly!</div></div>
    <iframe id="snapshot-iframe" src="{{src}}" scrolling="no" height="100%" width="{{width}}px"></iframe>

</body>
</html>