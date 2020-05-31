function hasTouch() {
    return 'ontouchstart' in window;
}

function attachDragEvents(el, gameKey) {
    var cancelDragging;
    var state = {
        down: false,
        dragging: false,
        zooming: false,
        x: 0,
        y: 0,
        pinch: 0
    };

    if (hasTouch()) {
        el.addEventListener('touchstart', function(e) {
            if (e.touches.length === 2 && !state.dragging) {
                clearTimeout(cancelDragging);
                state.zooming = true;
                state.pinch = pinchDistance(e.touches.item(0), e.touches.item(1));
                return;
            }
            state.down = true;
            state.x = e.touches.item(0).clientX;
            state.y = e.touches.item(0).clientY;
            cancelDragging = setTimeout(function() { state.dragging = true }, 200);
        });
    
        el.addEventListener('touchend', function(e) {
            clearTimeout(cancelDragging);
            
            if (!state.dragging && !state.zooming) {
                select(draw.highlight(state), gameKey);
            }
            
            state.down = false;
            state.dragging = false;
            state.zooming = false;
        });
    
        el.addEventListener('touchmove', function(e) {
            if (state.zooming) {
                var pinch = pinchDistance(e.touches.item(0), e.touches.item(1));
                draw.zoom(pinch / state.pinch);
                state.pinch = pinch;
                return;
            }

            if (state.down) {
                state.dragging = true;
                e.clientX = e.touches.item(0).clientX;
                e.clientY = e.touches.item(0).clientY;
                draw.move(e.clientX - state.x, e.clientY - state.y);
                state.x = e.clientX;
                state.y = e.clientY;
            }
        });

        return state;
    }
    
    el.addEventListener('mousedown', function(e) {
        state.down = true;
        state.x = e.clientX;
        state.y = e.clientY;
        cancelDragging = setTimeout(function() { state.dragging = true }, 200);
    });

    el.addEventListener('mouseup', function(e) {
        clearTimeout(cancelDragging);

        if (!state.dragging) {
            select(draw.highlight({ x: e.clientX, y: e.clientY }), gameKey);
        }

        state.dragging = false;
        state.down = false;
    });

    el.addEventListener('mousemove', function(e) {
        if (state.down) {
            state.dragging = true;
            draw.move(e.clientX - state.x, e.clientY - state.y);
            state.x = e.clientX;
            state.y = e.clientY;
        }
    });

    return state;
}
