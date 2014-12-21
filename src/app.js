function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

angular.module("app", [])
    .controller("AuthController", function ($scope, $http, $rootScope) {
        var OAUTHURL         = 'https://accounts.google.com/o/oauth2/auth?';
        var SCOPE            = 'https://www.googleapis.com/auth/drive';
        var CLIENTID         = '678077515881-lhvqjstk3kprf0ju8grnml2u8i148k98.apps.googleusercontent.com';
        var REDIRECT         = 'http://www.example.com/oauth2callback'
        //var LOGOUT         = 'http://accounts.google.com/Logout';
        var TYPE             = 'token';
        var OAUTHLOGINURL    = OAUTHURL + "scope=" + SCOPE + "&client_id=" + CLIENTID + "&redirect_uri=" + REDIRECT + "&response_type=token";

        var tokenType        = null;
        var expiresIn        = null;

        function getQueryStringParameter(url, name) {
            name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
            var regexS = "[\\#&]"+name+"=([^&#]*)";
            var regex = new RegExp( regexS );
            var results = regex.exec( url );
            if ( results == null ) return "";
            else return results[1];
        }

        function validateToken(token) {
            var VALIDURL = "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=";
            $http.get(VALIDURL + token)
                .success(function (data) {
                    expiresIn = data.expires_in;
                    $scope.accessToken = token;
                })
                .error(function (err) {
                    throw err;
                });
        }

        $scope.login = function () {
            var loginWindow = window.open(OAUTHLOGINURL, "Login", "width=800, height=600"); 
            var pollTimer = window.setInterval(function() { 
                try {
                    if (loginWindow.document.URL.indexOf(REDIRECT) != -1) {
                        window.clearInterval(pollTimer);
                        var url = loginWindow.document.URL;
                        tokenType = getQueryStringParameter(url, 'token_type');
                        loginWindow.close();
                        validateToken(getQueryStringParameter(url, 'access_token'));
                    }
                } catch (e) {

                }
            }, 100);
        };

        $scope.findFolder = function () {
            delete $scope.error;
            if ( ! $scope.form || ! $scope.form.folder ) return;
            if ( ! $scope.accessToken ) throw new Error("accessToken is missing.");

                //url: ,
            $http.get("https://www.googleapis.com/drive/v2/files?q=title+=+'" + $scope.form.folder + "'+and+mimeType+%3D+'application%2Fvnd.google-apps.folder'&access_token=" + $scope.accessToken)
                .success(function (data) {
                    if ( ! data.items.length ) return $scope.error = "Folder not found."
                    if (data.items.length == 1) {
                        $("#find-folder-modal").modal("hide");
                        return $rootScope.$emit("setfolderid", {name: $scope.form.folder, id: data.items[0].id});
                    }
                    return $scope.error = "Multiple folders with this name was found.";
                })
                .error(function (err) {
                    throw err;
                })
        };
    })
    .controller("PlayerController", function ($scope, $http, $rootScope, $sce) {

        $scope.folderId = "Root";
        $scope.folderName = "Root";

        $player = $("audio");

        $player.bind("ended", function () {
            $scope.$apply(function () {
                $scope.playerPlayNext();
            });
        });

        $scope.$watch("accessToken", function (token) {
            if (token) return $scope.getSongs();
            $scope.playerClear();
        });

        $scope.playerPlay = function (songIndex) {
            if ( ! $scope.songs || ! $scope.songs.length ) return;
            songIndex = songIndex || 0;
            $scope.songs.currentSongIndex = songIndex;
        };

        $scope.playerPause = function () {
            $player[0].pause();
        };

        $scope.playerPlayPrevious = function () {
            if ($scope.songs.currentSongIndex == null) return $scope.playerPlay(0);
            if ($scope.songs.currentSongIndex <= 0) return $scope.playerShuffle();
            $scope.playerPlay($scope.songs.currentSongIndex-1);
        };

        $scope.playerPlayNext = function () {
            if ($scope.songs.currentSongIndex == null) return $scope.playerPlay(0);
            if ($scope.songs.currentSongIndex+1 >= $scope.songs.length) return $scope.playerShuffle();
            $scope.playerPlay($scope.songs.currentSongIndex+1);
        };

        $scope.playerClear = function () {
            $scope.playerPause();
            $scope.songs = [];
        };

        $scope.getSongs = function () {
            $scope.songs = [];
            $http.get("https://www.googleapis.com/drive/v2/files?q='" + $scope.folderId + "'+in+parents+and+mimeType+%3D+'audio%2Fmpeg'&maxResults=1000&access_token=" + $scope.accessToken)
                .success(function (data) {
                    if ( ! data.items.length ) return;
                    data.items.forEach(function (item) {
                        $scope.songs.push({title: item.title.slice(0, -4), link: $sce.trustAsResourceUrl(item.webContentLink)});
                    });
                    $scope.playerSort();
                    $scope.playerPlay();
                })
                .error(function (err) {
                    throw err;
                });
        };

        $rootScope.$on("setfolderid", function (event, folder) {
            $scope.playerClear();
            $scope.folderId = folder.id;
            $scope.folderName = folder.name;
            $scope.getSongs();
        });

        $scope.playerSort = function () {
            if ( ! $scope.songs || ! $scope.songs.length ) return;
            $scope.songs.sort(function (a, b) {
                if (a.title < b.title) return -1;
                if (a.title > b.title) return 1;
                return 0;
            });
            $scope.playerPlay();
            $scope.playerShuffled = false;
        };

        $scope.playerShuffle = function () {
            if ( ! $scope.songs || ! $scope.songs.length ) return;
            shuffle($scope.songs);
            $scope.playerPlay();
            $scope.playerShuffled = true;
        };
    })
;
