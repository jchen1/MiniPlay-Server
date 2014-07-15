$(function() {
  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-48472705-1']);
  _gaq.push(['_trackPageview']);

  var url = 'http://miniplay.herokuapp.com';
  // var url = 'http://10.0.0.5:5000';

  var socket = io(url);
  var music_status = {};
  socket.on('connect', function() {
    socket.emit('room', {client : 'controller', room : email});
  });

  socket.on('data', update);

  if (socket.connected) {
    socket.emit('data', {action : 'update_status', type : name});
  }
  else {
    set_state('no_tab');
  }

  var email = get_email();
  if (email == '') {
    $('#login-overlay').css('display', 'table');
  }
  else {
    $('#main').show();
    setPositions();
  }

  window.setTimeout(setPositions, 1);


  $('#loading-overlay').hide();

  function get_email() {
    if (typeof(Storage) !== 'undefined') {
      var em = localStorage.getItem('email');
      return (em == null) ? '' : em;
    }
    else {
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf('email=') != -1) return c.substring('email='.length, c.length);
      }
      return '';
    }
  }

  function set_email(em) {
    if (typeof(Storage) !== 'undefined') {
      localStorage.setItem('email', em);
    }
    else {
      var d = new Date();
      d.setTime(d.getTime() + (365*24*60*60*1000));
      var expires = 'expires='+d.toGMTString();
      document.cookie = 'email=' + em + '; ' + expires + '; domain=' + url;
    }
    email = em;
    socket.emit('room', {client : 'controller', room : email});
  }

  function setPositions() {
    var width = $(window).width();
    var height = $(window).height();
    var size = Math.max(width, height) - $('top-bar').height() - $('bottom-bar').height();
    $('#album-art').width(size);
    $('#album-art').height(size);
    if (height > width) {
      $('#album-art').css('background-position-x', Math.round((height - width) / 2) * -1);
      $('#album-art').css('background-position-y', 0);
    }
    else {
      $('#album-art').css('background-position-x', 0);
      $('#album-art').css('background-position-y', Math.round((width - height) / 2) * -1);
    }
    //51 pt
    var topBarHeight = $('#top-bar').outerHeight();
    var settingIconHeight = 53;//$('#setting').css('background-size');
    var offset = Math.round((topBarHeight - settingIconHeight) / 2);
    $('#setting').css('background-position-y', offset);
  }

  function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
  }

  function set_state(state) {
    switch (state) {
      case 'no_tab':
        $('.interface').attr('disabled', true);
        $('#infobar').hide();
        $('#album-art').css('background-image', 'url("../img/default_album.png")');
        $('#title').html('No Google Music tab found');
        $('#artist').html('Make sure Google Music is open on your computer');
        break;
      case 'no_song':
        $('.interface').attr('disabled', true);
        $('#infobar').hide();
        $('#album-art').css('background-image', 'url("../img/default_album.png")');
        $('#title').html('No song selected');
        $('#artist').html('');
        $('#album').html('');
        break;
      case 'song':
        $('.interface').attr('disabled', false);
        $('#infobar').show();
        break;
    }
  }

  function update(response) {
    music_status = response;
    if (response === undefined) {
      set_state('no_tab');
    }
    else {
      if (response.title === '') {
        set_state('no_song');
      }
      else {
        set_state('song');
        $('#title').html(response.title);
        $('#artist').html(response.artist);
        $('#album').html(response.album);
        if (response.album_art == 'http://undefined') {
          response.album_art = 'img/default_album.png';
        }
        $('#album-art').css('background-image', 'url("' + response.album_art + '")');
        toggle_play(response.status);
        if (!slider.dragging) {
          $('#current-time').html(response.current_time);
          $('#total-time').html(response.total_time);
          var offset = Math.round((response.current_time_s / response.total_time_s) * ($('#slider').width() - ($('#slider-thumb').width())));
          $('#played-slider').attr('style', 'width:' + offset + 'px;');
          $('#slider-thumb').attr('style', 'left:' + offset + 'px;');
        }
        set_thumb(response.thumb);
        set_repeat(response.repeat);
        set_shuffle(response.shuffle);
      }
    }
  }

  function update_scrobble(value) {
    if (value === true) {
      $('#lastfm-toggle').removeClass('lastfm-checked');
      $('#lastfm-toggle').attr('title', 'Scrobbling enabled');
    }
    else {
      $('#lastfm-toggle').addClass('lastfm-checked');
      $('#lastfm-toggle').attr('title', 'Scrobbling disabled');
    }
  }

  function set_repeat(status) {
    if (status === 'SINGLE_REPEAT') {
      $('#repeat').addClass('control-single');
      $('#repeat').removeClass('control-list');
    }
    else if (status === 'LIST_REPEAT') {
      $('#repeat').addClass('control-list');
      $('#repeat').removeClass('control-single');
    }
    else if (status === 'NO_REPEAT') {
      $('#repeat').removeClass('control-single control-list');
    }
  }

  function set_shuffle(status) {
    if (status === 'NO_SHUFFLE') {
      $('#shuffle').removeClass('control-checked');
    }
    else if (status === 'ALL_SHUFFLE') {
      $('#shuffle').addClass('control-checked');
    }
  }

  function set_thumb(status) {
    if (status === '0') {
      $('.thumb').removeClass('control-checked');
    }
    else if (status === '5') {
      $('#down').removeClass('control-checked');
      $('#up').addClass('control-checked');
    }
    else if (status === '1') {
      $('#down').addClass('control-checked');
      $('#up').removeClass('control-checked');
    }
  }

  function toggle_play(status) {
    if (status === 'Pause') {
      $('#play').addClass('control-checked');
      $('#play').attr('title', 'Pause');
      $('#equalizer').addClass('equalizer-checked');
    }
    else if (status === 'Play') {
      $('#play').removeClass('control-checked');
      $('#play').attr('title', 'Play');
      $('#equalizer').removeClass('equalizer-checked');
    }
  }

  $('.control').click(function(ev) {
    var name = $(ev.currentTarget).attr('id');
    socket.emit('data', {action : 'send_command', type : name});
  });

  $('#setting').click(function(ev) {
    $('#menu').toggle();
    $('#menu').css('top', $('#top-bar').height());
    // ev.stopPropagation();
  });

  $('body').click(function(ev) {
    if ($('#menu').has(ev.target).length === 0) {
      // $('#menu').hide();
    }
  });

  $('#signout').click(function(ev) {
    set_email('');
    $('#login-overlay').css('display', 'table');
    $('#main').hide();
  });

  $('#email-box').submit(function() {
    set_email($('#email-input').val());
    $('#main').show();
    $('#login-overlay').hide();
    return false;
  });

  $(window).resize(setPositions);

  var slider = new Dragdealer('slider', {
    callback: function(x, y) {
      if (socket.connected) {
        socket.emit('data', {action : 'send_command', type : 'slider', position : x});
      }
    },
    animationCallback: function(x, y) {
      if (music_status.total_time_s !== undefined) {
        $('#played-slider').css('width', $('#slider-thumb').css('left'));
        $('#current-time').html(secondsToHms(Math.round(x * music_status.total_time_s)));
      }
    },
    x: $('#played-slider').width() / ($('#slider').width() - ($('#slider-thumb').width())),
    speed: 1,
    slide: false
  });

  var vslider = new Dragdealer('vslider', {
    callback: function(x, y) {
      console.log('cb ' + y + ' ' + x);
      if (socket.connected) {
        socket.emit('data', {action : 'send_command', type : 'vslider', position : 1 - y});
      }
    },
    animationCallback: function(x, y) {
      console.log('an ' + y+ ' ' + x);
      // $('#played-vslider').css('height', -1 * $('#vslider-thumb').css('top'));
    },
    horizontal: false,
    vertical: true,
    y: 1,
    //x: $('#played-vslider').width() / ($('#vslider').width() - ($('#vslider-thumb').width())),
    speed: 1,
    slide: false
  });

  /*
  $('#lastfm-toggle').on('click', function() {
    chrome.storage.sync.set({'scrobbling-enabled': $('#lastfm-toggle').hasClass('lastfm-checked')});
  });*/

  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
});
