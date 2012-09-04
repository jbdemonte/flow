/*
  This file includes features used in differents examples :
  - previous, next and autorun buttons 
  - img click focusing function
  - mousewheel managing 
*/
$(function(){

  $("body").append(
    '<div id="buttons">'+
      '<button id="previous">previous</button>'+
      '<button id="next">next</button>'+
      '<br /><br />'+
      '<input type="checkbox" id="autorun"><label for="autorun">Autorun</label>'+
    '</div>'
  );
  
  var $cover = $("#coverflow");

  $('body').mousewheel(function(event, delta) {
    if (delta < 0) {
      $cover.flow('previous');
    }else if (delta > 0){
      $cover.flow('next');
    }
    event.preventDefault();
  });

  $("#next").click(function(){
    $("#autorun").attr('checked', false);
    $cover.flow('next');
  });
  
  $("#previous").click(function(){
    $("#autorun").attr('checked', false);
    $cover.flow('previous');
  });
  
  $("#coverflow img").each(function(index){
    $(this).click(function(){
      $cover.flow(index);
    });
  });
  
  var id;
  
  $("#autorun").change(function(){
    if ($(this).is(':checked')){
      $cover.bind("run_end.flow", function(event, complete){
        if (complete){
          id = setTimeout(
            function(){
              if ($("#autorun").is(':checked')){
                $cover.flow('next');
              }
            }, 50);
        }
      });
      $cover.flow('next');
    } else {
      $cover.unbind("run_end.flow");
      clearTimeout(id);
    }
  });
  
});