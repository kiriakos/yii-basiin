<?php if(0) { ?><script><?php } ?>
// basiin login action
// redirect to the kindstudios login screen
// keeping the launch url so that you can return later
location.href="http://<?php
    echo $_SERVER['SERVER_NAME'].
    Yii::app()->urlManager->createUrl('site/login', array('returnUrl'=>''));
?>"+encodeURIComponent(location.href);

<?php if(0) { ?></script><?php } ?>