function Game() {};


var PlayArea = class {
  constructor(x, y, width, height, id) {
      this.width = width;
      this.height = height;
      this.x = x
      this.y = y
      this.speedX = 0;
      this.speedY = 0;
  }
  draw(gfx, pl_arr) {
    gfx.beginPath();
    gfx.lineWidth = "2";
    gfx.strokeStyle = "white";
    gfx.rect(this.x, this.y, this.width, this.height);
    gfx.stroke();
    for (var i = 0; i < pl_arr.length; i++) {
        gfx.beginPath();
        gfx.arc(this.x + pl_arr[i].x, this.y + pl_arr[i].y, pl_arr[i].radius, 0, 2 * Math.PI, true);
        gfx.fillStyle = "#fff";
        gfx.fill();
    }
  }
}

var Circle = class {
    constructor(initialX, initialY, id, rad) {
        this.x = initialX;
        this.y = initialY;
        this.id = id;
        this.radius = rad
    }
    draw(ctx, width, height, canvX, canvY) {
        ctx.beginPath();
        ctx.arc(width/2, height/2, this.radius, 0, 2 * Math.PI, true);
        ctx.fillStyle = "#fff";
        ctx.fill();
    }
    get_id() {
        return (this.id);
    }
    change_id(new_id) {
        this.id = new_id;
        return (false);
    }
}

var map = new PlayArea(0, 0, 1400, 700);
var player = new Circle(map.width/2, map.height/2, "", 10);
var players = [];

Game.prototype.handleNetwork = function(socket) {

    function player_not_found(pl_arr, pl) {
        var ret = true;
        for (var i = 0; i < pl_arr.length; i++) {
            if (pl_arr[i].id == pl.id) {
                ret = false;
            }
        }
        return (ret);
    }

    function replace_player(pl_arr, pl) {
        for (var i = 0; i < pl_arr.length; i++) {
            if (pl_arr[i].id == pl.id) {
                pl_arr[i] = pl;
            }
        }
        return (pl_arr);
    }

    function remove_player(pl_arr, pl) {
        for (var i = 0; i < pl_arr.length; i++) {
            if (pl_arr[i].id == pl) {
                pl_arr.splice(i, 1);
            }
        }
        return (pl_arr);
    }
    socket.on('init', function(new_player) {
        if (JSON.parse(new_player).id != player.get_id() && player_not_found(players, JSON.parse(new_player))) {
            players.push(JSON.parse(new_player));
            socket.emit('init', JSON.stringify(player));
        }
    });
    socket.on('update', function(upd_player) {
        if (JSON.parse(upd_player).id != player.get_id()) {
            players = replace_player(players, JSON.parse(upd_player));
        }
    });
    socket.on('remove_pl', function(old_pl_id) {
        players = remove_player(players, old_pl_id);
    });
    socket.on('id', function(id) {
        player.change_id(id);
        socket.emit('init', JSON.stringify(player));
    });
}

Game.prototype.handleLogic = function(socket, w, h) {
    map.speedX = -(mouseX - (map.width/2))/85;
    map.speedY = -(mouseY - (map.height/2))/85;

    // if speed > some_constant
    if (map.speedX > 3) {
      map.speedX = 3;
    } else if (map.speedX < -3) {
      map.speedX = -3;
    }

    if (map.speedY > 3) {
      map.speedY = 3;
    } else if (map.speedY < -3) {
      map.speedY = -3;
    }

    if (!(map.x + map.speedX + player.radius > map.width / 2) && !(map.x + map.speedX - player.radius < (-1 * map.width / 2))){
      map.x += map.speedX;
      player.x -= map.speedX;
    }
    if (!(map.y + map.speedY + player.radius > map.height / 2) && !(map.y + map.speedY - player.radius < (-1 * map.height / 2))){
      map.y += map.speedY;
      player.y -= map.speedY;
    }

    socket.emit('update', JSON.stringify(player));
}

Game.prototype.handleGraphics = function(gfx, w, h) {
    gfx.clearRect(0, 0, w, h);

    gfx.beginPath();
    gfx.fillStyle = "black";
    gfx.fillRect(0, 0, w, h);

    map.draw(gfx, players);

    player.draw(gfx, map.width, map.height, map.x, map.y);
}
