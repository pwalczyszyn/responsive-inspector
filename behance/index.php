<!DOCTYPE html>
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]-->
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title>Responsive Inspector &lt;-&gt; Behance</title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width">

        <!-- Place favicon.ico and apple-touch-icon.png in the root directory -->

        <link rel="stylesheet" href="../css/normalize.css">
        <link rel="stylesheet" href="../css/main.css">
        <link rel="stylesheet" href="../css/behance.css">
        
        <script src="../js/vendor/modernizr-2.6.2.min.js"></script>
        <script src="http://use.edgefonts.net/source-code-pro.js"></script>
    </head>
    <body>
        <!--[if lt IE 7]>
            <p class="chromeframe">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> or <a href="http://www.google.com/chromeframe/?redirect=true">activate Google Chrome Frame</a> to improve your experience.</p>
        <![endif]-->

        <!-- Add your site or application content here -->
        <div id="container">
            <h2>Responsive Inspector</h2>
            <?php
                $state = ($_GET["state"] != null) ? $_GET["state"] : ($_GET["error"] != null ? 'error' : 'unknown');
            ?>
            <div class="logos">
                <img src="../img/ri-logo.png"/>
                <img src="../img/auth-<?= $state ?>.<?= $state == 'processing' ? 'gif' : 'png' ?>"/>
                <img src="../img/bh-logo.png"/>
            </div>
            <?php if ($state == 'processing') { ?>
            <div class="processing">
                <span class="authorization-status">Authorizing, please wait few seconds!</span>
            </div>
            <?php } else if ($state == 'complete') { ?>
            <div class="complete">
                <span class="authorization-status">Authorization successful!</span>
                <p>Responsive Inspector is now ready for your WIPs.</p>
                <p>You can close this window now.</p>
            </div>
            <?php } else if ($state == 'error') { ?>
            <div class="error">
                <span class="authorization-status">Authorization error!</span>
                <p><strong>Error reason:</strong> <?= $_GET["error_reason"]?></p>
                <p><strong>Error message:</strong> <?= $_GET["error_message"]?></p>
                <p>Please <a href="http://outof.me/contact/" target="_blank">contact me</a> and let me know that something went wrong!</p>
            </div>
            <?php } else { ?>
            <div class="unknown">
                Behance :: OAuth authorization redirect page
            </div>
            <?php } ?>
        </div>

        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
        <script>window.jQuery || document.write('<script src="../js/vendor/jquery-1.9.1.min.js"><\/script>')</script>
        <script src="../js/plugins.js"></script>

        <!-- Google Analytics: change UA-XXXXX-X to be your site's ID. -->
        <script>
            var _gaq=[['_setAccount','UA-29275320-1'],['_trackPageview']];
            (function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
            g.src='//www.google-analytics.com/ga.js';
            s.parentNode.insertBefore(g,s)}(document,'script'));
        </script>
    </body>
</html>
