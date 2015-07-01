// This is a dummy file

<?php if(!$mobile) {
	?>
    <div style="float:right;">
    Results style: <a <?php print $query_vars['sort'] == 'expanded' ? 'class="current-sort"' : ""; ?> href="<?php echo search_url($query_vars, array('sort')); ?>&sort=expanded">Expanded</a> | <a <?php print $query_vars['sort'] == 'title' ? 'class="current-sort"' : ""; ?> href="<?php echo search_url($query_vars, array('sort')); ?>&sort=title">Title</a>
		<?php if($section == 'housing') { ?>
    | <a <?php print $query_vars['sort'] == 'map' ? 'class="current-sort"' : ""; ?> href="<?php echo search_url($query_vars, array('sort')); ?>&sort=map">Map</a>
    <?php } ?>
			<br />
		</div>
	<?php } ?>


<!-- <div id="search-query" class="text-center">
    <div id="sort-container">
    <div class="controls"> -->

    <script src="../../../js/jquery-1.11.2.min.js" type="text/javascript"></script>
    <script src="https://maxcdn.bootstrapcdn.com/twitter-bootstrap/2.3.2/js/bootstrap.min.js"></script>
    <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDqjuhGFoWJGDwsbIkryLn0W-bWLxBoGrY"></script>
    <script type="text/javascript" src="../../../js/jquery.scrollTo.min.js"></script>
    <script type="text/javascript" src="../../../js/markerclusterer_compiled.js"></script>
    <script src="../../../js/maptool.js"></script>

<!--  <?php
    print form_open(base_url('search'), array(
      'class' => 'form-inline',
      'method' => 'get',
    ));
  ?> -->

  <form action="javascript:void(0);" method="get" class="form-inline">
        <div>
            <div class="span12">
                <div class="navbar">
                        <div class="navbar-inner filter-inner">
                            <a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
                                Filter by...
                            </a>

                            <ul class="nav nav-collapse collapse filter-nav">
                                <!--<a class="brand">Filter by:</a>-->
                                <li class="divider-vertical filter-divider">
                                    <input type="text" class="input-small js-filter-price" placeholder="Max Price" name="price">
                                </li>
                                <li class="divider-vertical filter-divider">
                                    <select class="input-small js-filter-beds" name="beds">
                                        <option value='' disabled selected>Min Bed</option>
                                        <option value="1"> 1 </option>
                                        <option value="2"> 2 </option>
                                        <option value="3"> 3 </option>
                                        <option value="4"> 4 </option>
                                        <option value="5"> 5 </option>
                                        <option value="6"> 6 </option>
                                    </select>
                                </li>
                                <li class="divider-vertical filter-divider">
                                    <select class="input-small js-filter-baths" name="baths">
                                        <option value="" disabled selected>Min Bath</option>
                                        <option value="1"> 1 </option>
                                        <option value="2"> 2 </option>
                                        <option value="3"> 3 </option>
                                    </select>
                                </li>
                                <li class="divider-vertical filter-divider">
                                    <select class="input-small js-filter-gender" name="gender">
                                        <option value="" disabled selected>Gender</option>
                                        <option value="">Any</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </li>
                                <li class="divider-vertical filter-reward filter-divider">
                                    <label class="checkbox input-medium">
                                        <input type="checkbox" class="js-filter-reward">$100 Reward
                                    </label>
                                </li>
                                <input id="search-input-hidden" type="hidden" name="q" value="<?php print set_value('q', $query); ?>" tabindex="1">
  				<input id="section-input-hidden" type="hidden" name="section" value="<?php print set_value('section', $section); ?>" tabindex="1">
     				<input id="sort-input-hidden" type="hidden" name="sort" value="map" tabindex="1">
                                <button type="submit" class="btn btn-success js-filter-btn">GO!</button>
                            </ul>
                        </div>
                </div>
            </div>
        </div>
        </form>

        <div>
            <div class="span5 housing-container">
                <div class="js-housing accordion" id="js-listings">
                    <!-- Housing listings go here -->
                </div>
            </div>
            <div class="span7 map-container">
                <div class="map" id="map-canvas"></div>
            </div>
        </div>

<div style="clear:both;"></div>


<!-- ////// ORIGINAL U-SWAP CODE ... dont need? ///////

  		<table align="center">
  <tr>
  <td style="width:100px">
  		<select id="gender-input" name="gender">
      <option value="" <?php echo set_select('gender', '', TRUE); ?> disabled>Gender</option>
      <option value="" <?php echo set_select('gender', 'Any'); ?>>Any</option>
      <option value="Female" <?php echo set_select('gender', 'Female'); ?>>Female</option>
      <option value="Male" <?php echo set_select('gender', 'Male'); ?>>Male</option>
			</select>
   </td>
   <td>
      <input id="beds-input" class="input-mini" type="text" name="beds" value="<?php print set_value('beds', $query_vars['beds']); ?>" placeholder="<?php print "Beds" ?>">
   </td>
   <td rowspan="2" valign="middle">
   		<input id="search-input-hidden" type="hidden" name="q" value="<?php print set_value('q', $query); ?>" tabindex="1">
  		<input id="section-input-hidden" type="hidden" name="section" value="<?php print set_value('section', $section); ?>" tabindex="1">
      <input id="sort-input-hidden" type="hidden" name="sort" value="<?php print $query_vars['sort']; ?>" tabindex="1">
      <?php if(!$mobile) { ?>
      <button id="search-button" class="btn btn-primary" type="submit">Refine</i></button>
      <?php } ?>
   </td>
   </tr>
   <tr>
   <td style="width:100px">
      <input id="price-input" class="input-mini" type="text" name="price" value="<?php print set_value('price', $query_vars['price']); ?>" placeholder="<?php print "Max Price" ?>">
   </td>
   <td>
      <input id="baths-input" class="input-mini" type="text" name="baths" value="<?php print set_value('baths', $query_vars['baths']); ?>" placeholder="<?php print "Baths" ?>">
  	</td>
    </tr>
    <?php if($mobile) { ?>
    <tr>
    <td class="refine-container" colspan="2">
      <button id="search-button" class="btn btn-primary" type="submit">Refine</i></button>
  	</td>
    </tr> -->
      <?php } ?>


<!-- ////// ORIGINAL U-SWAP CODE ... dont need? ///////
     </table>
  	</form>
  </div>	 -->


<!-- ////// ORIGINAL U-SWAP CODE ... dont need? /////// -->
<!-- </div>
</div>
<div id="results">
  <?php print $results; ?>
</div>