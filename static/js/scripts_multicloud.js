$(document).ready(function(){
	// Error handler
	$("form").submit(function(e){
	    //e.preventDefault();
	    //var data = $(this).serializeFormJSON();
	    //console.log(data);
		if ($("#multicloudtopicfile").is(":checked") && $("#mcfilesselectbttnlabel").html() == ""){
			$('#error-message').text("No MALLET topic file uploaded.");
			$('#error-message').show().fadeOut(3000, "easeInOutCubic");
			return false;
		} else if ($("#multiclouduserfiles").is(":checked") && $("input[name='segmentlist']:checked").length < 1) {
			$('#error-message').text("No documents selected from actives.");
			$('#error-message').show().fadeOut(3000, "easeInOutCubic");
			return false;
		} else{
			$("#status-visualize").css({"visibility":"visible", "z-index": "400000"});
			return true;
		}
	});

	// Show filename of uploaded file
	$('.multicloud-upload').change(function(ev) {
		filename = ev.target.files[0].name;
		$(this).siblings('.bttnfilelabels').html(filename);
	});

	$("#allCheckBoxSelector").click(function(){
		if (this.checked) {
			$(".minifilepreview:not(:checked)").trigger('click');
		} else {
			$(".minifilepreview:checked").trigger('click');
		}
	});

	var prev = -1; //initialize variable
	$("#vizcreateoptions").selectable({       
		filter: "label",  //Makes the label tags the elts that are selectable
		selecting: function(e , ui){
			var currnet = $(ui.selecting.tagName, e.target).index(ui.selecting);   //gets index of current taget label
			if (e.shiftKey && prev > -1) {      //if you were holding the shift key and there was a box previously clicked
				//take the slice of labels from index prev to index curr and give them the 'ui-selected' class
				$(ui.selecting.tagName,e.target).slice(Math.min(prev,currnet)+1, Math.max(prev,currnet)+1).addClass('ui-selected');
				prev = -1;  //reset prev index
			}else{
				prev = currnet;  //set prev to current if not shift click
			}
		},
		stop: function() {
			//when you stop selecting, all inputs with the class 'ui-selected' get clicked
			$(".ui-selected input").trigger("click"); 
		}
	});

	// Display the document selection options on page load
	$("#multicloud-selection").show();
	$("#multicloud-upload").hide();
});


$(window).on("load", function() {
	// Section below can cause program crash
	// Show the loading icon before submit
	// $("form").submit(function(e) {
	// 	var self = this;
	// 	e.preventDefault();
	// 	$("#status-prepare").css({"visibility": "visible", "z-index": "400000"});
	// 	self.submit();
	// 	return false; //is superfluous, but I put it here as a fallback
	// });

	// Decrease the first wordScale domain numbers to increase size contrast
	wordScale = d3.scale.linear().domain([1,5,50,500]).range([10,20,40,80]).clamp(true);
	wordColor = d3.scale.linear().domain([10,20,40,80]).range(["blue","green","orange","red"]);

	numSegments = dataset.length;

	$('<ul id="sortable">').appendTo('#multicloud-container');

	for (i = 0; i < numSegments; i++) {
		$('<li class="ui-state-default" id="cloud'+i+'">').appendTo('#sortable');
		//$('#exspecto-nubes').html('Loading '+i+ ' of '+numSegments+'...');
		
		viz = d3.select("#cloud"+i).append("svg")
				.attr("width", 300)
				.attr("height", 380)
				.attr("id", "svg" + i);
	}
		
	for (i = 0; i < numSegments; i++) {
		statusText = d3.select("#status");
		segment = dataset[i];
		label = segment["name"];
		children = segment["children"];
		wordCounts = constructWordCounts(children);

		function draw(words) {
			var isDrag=0;
			var tooltip = d3.select("body").append("div")
				.attr("class", "wCtooltip")
				.style("opacity", 0)
				.attr("id",i);


			var viz = d3.select("#svg" + i);
			
			viz.append("g")
				.attr("transform", "translate(150,190)")

				.attr("class", "bigG"+i)


			.selectAll("text")
				.data(words)
			.enter().append("text")
				.attr("id", function(d) {return wordCounts[d.text]; })
				.attr("title", i)
				.style("font-size", function(d) { return d.size + "px"; })
				.style("fill", function(d) { return wordColor(d.size); })
				.style("opacity", .75)
				.style('cursor', 'pointer')
				.attr("text-anchor", "middle")
				.attr("transform", function(d) {
					return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
				})
				.on("mouseover", function() {

					if (isDrag==0) //fixes bug where the tootips would be visible while dragging the li elements
					{
					var posX = d3.transform(d3.select(this).attr("transform")).translate[0];
					var posY = d3.transform(d3.select(this).attr("transform")).translate[1];
					var parent = "." + $(this).parent()[0].className.baseVal;
					//Here we declare 3 variables. the x position of the svg text,
					//the y element of the svg text, and the class of the parent element (the g)

					tooltip.transition()
						.duration(200)

						.style("opacity", 1);
					tooltip.html((this.id) + " instance(s) of: " + (this.innerHTML))

						.style("left", (posX + $(parent).offset().left + 100) + "px") //finds the parent class, gets that offset, and
						//adds the relative x transform, +100 for positioning. next line does the same but for vertical offset.
						.style("top", (posY + $(parent).offset().top + 100) + "px");
				}
				})
      .on("mousedown", function() {

		  isDrag=1; //something is being dragged
		  tooltip.style("opacity", 0)})
	  .on("mouseup", function() {

		  isDrag=0}) //no more dragging, tooltips can appear again
      .on("mouseout", function() {
          tooltip.transition()
               .duration(200)
               .style("opacity", 0);
      })

				.text(function(d) { return decodeURIComponent(escape(d.text)); })


			viz.append("text")
				.data(label)
				.attr("id", 12)
				.style("font-size", 14)
				.style("font-weight", 900)
				 //100
				.attr("y", 20)
				//15
				.text(function() { return decodeURIComponent(escape(label)); })
				.attr("x", function(){return 150-this.clientWidth/2;})
				
		}

		d3.layout.cloud().size([280, 290])
				.words(children)
				.rotate(function() { return ~~(Math.random() * 2) * 5; })
				.fontSize(function(d) { return wordScale(d.size); })
				.on("end", draw)
				.start();
	}

	if ($("#svg0")[0]) { 
		$( "#tips" ).html("<p>Drag the clouds to rearrange them.</p>");
	}

	//$("#exspecto-nubes").fadeOut();

	function constructWordCounts(list) {
		wordCounts = {};

		for (var i = 0; i < list.length; i++) {
			word = list[i].text;
			count = list[i].size;

			wordCounts[word] = count;
		}

		return wordCounts;
	}
	
	$( "#sortable" ).sortable({ revert: 100 });
	$( "#sortable" ).disableSelection();


});

/* This is a generic function to serialise html form data as vanilla 
   (not d3.js) json. It should probably be moved to scripts_base.js if it
   is useful. */
(function ($) {
    $.fn.serializeFormJSON = function () {

        var o = {};
        var a = this.serializeArray();
        $.each(a, function () {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
})(jQuery);