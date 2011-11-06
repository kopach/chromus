class Player extends Backbone.Model
    player_url: "http://chromusapp.appspot.com/"
    #@player_url: "http://localhost:8080/";


    initialize: ->
        _.bindAll @
        
        @path = chromus.plugins_info['iframe_player'].path

        @state = new Backbone.Model()

        @createFrame()


    createFrame: ->
        @player_frame = document.createElement("iframe")
        @player_frame.id = 'player_frame'
        @player_frame.style.display = 'none'

        if not browser.isFrame and not browser.isSafari            
            @player_frame.src = @player_url + "sm2_iframe"
        else
            @player_frame.src = "#{@path}/sm2/iframe.htm"            
                                                            
        document.body.appendChild @player_frame
            
        @player_ready = false

        window.addEventListener 'message', @listener, false

    
    listener: (evt) ->
        return if !evt.data

        msg = JSON.parse(evt.data)

        switch msg.method
            when 'playerState'
                @state.set msg.state

            when 'ready'
                @player_ready = true

            when 'finished'
                @state.set name:"stopped"
                
            else
                console.log "Received unknown message:", msg


    postMessageToPlayer: (data) ->
        @player_frame.contentWindow.postMessage(JSON.stringify(data), '*')

    
    play: (track) ->
        @state.unset 'name', silent:true

        @postMessageToPlayer
            'method': 'play',
            'url': track.file_url,
            'track': track.id,
            'use_flash': track.use_flash


    preload: (track) ->
        @postMessageToPlayer
            'method': 'preload',
            'url': track.file_url,
            'track': track.id,
            'use_flash': track.use_flash


    pause: ->
        @postMessageToPlayer 'method': 'pause'

    
    stop: ->
        @postMessageToPlayer 'method': 'stop'
        

    setVolume: (value) ->
        @postMessageToPlayer
            'method': 'setVolume'
            'volume': value


@chromus.registerPlayer("iframe_player", new Player());