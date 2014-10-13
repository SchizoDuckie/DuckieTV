<title>DuckieTV - Deploying</title>
<h1>DuckieTV Deployment Script</h1>
<pre>

<?php
flush();
ob_end_flush();

system('gulp deploy');

?>
<script type='text/javascript'>
document.querySelector('title').innerText = 'DuckieTV - Deployment built.';
</script>