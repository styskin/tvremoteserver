 
function t391_checkSize(recid){
  var el=$("#rec"+recid);
  var cover = el.find('.t-cover');
  var carrier = el.find('.t-cover__carrier');
  var filter = el.find('.t-cover__filter');
  var height = el.find('.t391__firstcol').height() + el.find('.t391__secondcol').height();
  if (window.matchMedia('(max-width: 960px)').matches) {
    cover.css('height',height);
    carrier.css('height',height);
    filter.css('height',height);
  }
}