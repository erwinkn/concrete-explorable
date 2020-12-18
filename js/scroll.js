// --- Scroller ---
function scroller() {
    // Code largely taken from https://github.com/vlandham/scroll_demo/blob/gh-pages/js/scroller.js

    // cleanup?
    let container = null;
    // y coordinate of visualisation SVG container
    let containerStart = 0;
    // d3 selection of all the sections
    let sections = [];
    // y coordinate of each section
    let sectionPositions = [];
    let currentSection = -1;
    // Event dispatcher
    let dispatch = d3.dispatch('active', 'progress');

    // Sets up scroller for monitoring elements in the provided selection
    function scroll(els) {
        console.log('Called scroll.scroll with els.size = ' + els.size());
        sections = els;
        d3.select(window)
          .on('scroll.scroller', position)
          .on('resize.scroller', resize);
        // Manual call for initial setup
        resize();
        // position();
        // Original code included a hack using d3.timer to call position
        // exactly once on load. Not sure why it's needed?
        var timer = d3.timer(function () {
            position();
            timer.stop();
        });
    }

    // determines the vertical position of each section on the viewport,
    // relative to the first section
    function resize() {
        console.log('Called scroll.resize');
        sectionPositions = [];
        let startPos;
        sections.each(function(d,i){
            // personal note: this rebound to the current element of sections
            let top = this.getBoundingClientRect().top;
            if(i === 0) {
                startPos = top;
            }
            sectionPositions.push(top - startPos);
        });
        // what does this serve?
        containerStart = container.node().getBoundingClientRect().top + window.pageYOffset;
        console.log('containerStart = ' + containerStart);
        console.log(sectionPositions);
    }

    // Get user's current position
    // Dispatch active event with new section index on section change
    function position() {
        console.log('Called scroll.position');
        // -10 offset to make sure we get `0` from d3.bisect at container start
        let pos = window.pageYOffset - containerStart - 10; // - 10; // - containerStart;
        let sectionId = d3.bisect(sectionPositions, pos);
        if(currentSection !== sectionId) {
            dispatch.call('active', this, sectionId);
            currentSection = sectionId;
        }

        let prevIndex = Math.max(sectionId - 1, 0);
        let prevTop = sectionPositions[prevIndex];
        let progress = (pos - prevTop) / (sectionPositions[sectionId] - prevTop);
        progress = isFinite(progress) ? progress : 1;
        dispatch.call('progress', this, currentSection, progress);
    }

    scroll.container = function(value) {
        // likely useful because of name overlap?
        if (arguments.length === 0) {
            return container;
        }
        container = value;
        return scroll;
    };

    scroll.on = function(action, callback) {
        dispatch.on(action, callback)
    };

    return scroll;
}
