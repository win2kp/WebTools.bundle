// Stores values generic to Webtools. Function declerations are done further down in the script.
var webtools = {
    modules: [],
    active_module: '',
    functions: {},
	version: 0,
    list_modules: new asynchelper(true,false),
    activate_module: function() {},
    display_error: function() {},
    save_options: function() {},
    listlogfiles: function() {},
    log: function() {},
    show_log: function() {},
    changepassword_display: function() {},
    changepassword_work: function() {},
	updates_check: function () {},
	updates_check_display: function () {}
};

// Webtools function

webtools.list_modules.inline([
    function(callback,activatemodulename) {
        //Name:VersionFetch
        $('#LoadingModal').modal({keyboard: false, backdrop:'static', show:true});  
        $('#OptionsMenu').html('');
        $.ajax({
                url: '/webtools/version',
                cache: false,
                dataType: 'JSON',
                success: function(data) {
					webtools.version = data.version;
                    $('#MainLink').html('Webtools - v' + data.version);
                    if (data.PlexTVOnline === false) {
                        $('#OptionsMenu').append('<li><a class="customlink" onclick="webtools.changepassword_display();" >Change Password</a></li>');
                    }
					$('#OptionsMenu').append('<li><a class="customlink" onclick="webtools.updates_check_display();" >Check for Updates</a></li>');
                    callback('VersionFetch:Success',activatemodulename);
                },
                error: function(data) {
                    webtools.display_error('Failed fetching the version from the server. Reload the page and try again.<br>If the error persists please restart the server.<br>Contact devs on the Plex forums if it occurs again.<br>'
                                  +'<br>Errorinfo:'
                                  +'<br>Requested URL: ' + this.url
                                  +'<br>Error Code/Message: ' + data.status + '/'  + data.statusText);
                    $('#LoadingModal').modal('hide');
                    webtools.list_modules.abort('Error: ' + data.statusText);
                }
            });
    },
    function(callback,activatemodulename) {
        $.ajax({
            url: '/webtools/listmodules',
            type: 'GET',
            cache: false,
            dataType: 'JSON',
            success: function(data) {
                //webtools.modules = data;
                // For testing purposes only:
                webtools.modules = [['subtitlemgmt', 'Subtitle Management'],['logviewer','LogViewer Tool']];
                callback(false,activatemodulename);
            },
            error: function(data) {
                //webtools.modules = data;
                // For testing purposes only:
                webtools.modules = [['subtitlemgmt', 'Subtitle Management'],['logviewer','LogViewer Tool']];
                callback(false,activatemodulename);
            }
        });
    },
    function(callback,activatemodulename) {
        webtools.listlogfiles(callback, activatemodulename);
    }
],
function(result,activatemodulename) {
    //console.log(typeof(activatemodulename));
    if (typeof(activatemodulename) == 'undefined') {
    
        var contents = [
            'Webtools is a tool that enables the use of modules to help you with your Plex Server management.<br>',
            '<b>Available Modules</b>'];
        webtools.modules.forEach( function(modulename) {
            contents.push('<a class="customlink" onclick="webtools.activate_module(\''+modulename[0]+'\')">'+modulename[1]+'</a>');
        });
        $('#ContentBody').html(contents.join('<br>'));   
        $('#LoadingModal').modal('hide');
    } else {
        webtools.activate_module(activatemodulename);
    }
});

// This module sets the active module and launches it's start function.
webtools.activate_module = function(modulename) {
    $('#navfoot').html(''); 
    $('#ContentFoot').html('');
    $('#LoadingModal').modal({keyboard: false, backdrop:'static', show:true}); 
    $.ajax({
        url: 'modules/'+modulename+'/jscript/'+modulename+'.js',
        cache: false,
        dataType: 'script',
        global: false,
        success: function() {
            webtools.active_module = modulename;
            webtools.functions[modulename].start();
            if (webtools.functions[modulename].hasoptions === true) {    
                $("#OptionsMenu").append('<li><a class="customlink" onclick="javascript:webtools.functions[\''+modulename+'\'].show_options();" >Preferences</a></li>');
            }   
            
            if ($('#OptionsMenu li').length === 0) {
                $('#OptionsMainLi').html('');
            }
            
            var moduledisplayname = '';
            webtools.modules.forEach( function(modulename_find) {
                if (modulename_find[0] == modulename) {
                    moduledisplayname = modulename_find[1];
                }
            });
            
            
            $("#SubLink").attr('onclick','javascript:webtools.list_modules.start(\'' + modulename + '\')');
            $("#SubLink").html('/'+moduledisplayname);
            
            $('#ModuleCSS').attr('href','modules/'+modulename+'/css/'+modulename+'.css');
            
            $('#LoadingModal').modal('hide');
        },
        error: function(data) {
            webtools.display_error('Failed activating the module. Reload the page and try again.<br>If the error persists please restart the server.<br>Contact devs on the Plex forums if it occurs again.<br>'
                          +'<br>Errorinfo:'
                          +'<br>Requested URL: ' + this.url
                          +'<br>Error Code/Message: ' + data.status + '/'  + data.statusText);
            $('#LoadingModal').modal('hide');
        }
    });
};

// The only purpose of this is to display a modal with an error message.
webtools.display_error = function(message) {
    $('#myModalLabel').html('An error occured.');
    $('#myModalBody').html(message);
    $('#myModalFoot').html('<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>');
    $('#myModal').modal('show');
};

webtools.save_options = function() {
   webtools.functions[webtools.active_module].save_options(); 
};

webtools.listlogfiles = function(callback,activatemodulename) {
    
    $('#LoadingModal').modal({keyboard: false, backdrop:'static', show:true});  
    //Name:LogfileNamesFetch
    $("#LogfilesMenu").html('');
    $.ajax({
        url: '/webtools/logs/',
        cache: false,
        dataType: 'JSON',
        success: function(data) {

            //console.log(data);
            data.forEach(function (logfilename) {
                if (logfilename.toLowerCase().indexOf('webtools') > -1) {
                    $('#LogfilesMenu').append('<li><a class="customlink" onclick="javascript:webtools.show_log(\''+logfilename+'\')">' + logfilename + '</a></li>');
                }
            });

            $('#LogfilesMenu').append('<li><a class="customlink" href="/webtools/logs/zip">Download all logfiles as Zip</a></li>');
            $('#LogfilesMenu').append('<li><a class="customlink" onclick="javascript:webtools.listlogfiles();">Refresh Logfilelist</a></li>');
            if (typeof(callback) != 'undefined') {
                callback('LogfileNamesFetch:Success',activatemodulename);
            } else {
                $('#LoadingModal').modal('hide');
            }
        },
        error: function(data) {
            webtools.display_error('Failed fetching the logfilenames from the server. Reload the page and try again.<br>If the error persists please restart the server.<br>Contact devs on the Plex forums if it occurs again.<br>'
                          +'<br>Errorinfo:'
                          +'<br>Requested URL: ' + this.url
                          +'<br>Error Code/Message: ' + data.status + '/'  + data.statusText);
            $('#LoadingModal').modal('hide');
            if (typeof(callback) != 'undefined') {
                webtools.list_modules.abort('Error: ' + data.statusText);
            }
        },

    });     
};

webtools.log = function (LogEntry, Source) {
    if (typeof(Source) == 'undefined') {       
        Source = webtools.active_module;      
    }
    
    $.ajax({
        url: '/webtools/logs/[' + Source + '] ' + encodeURIComponent(LogEntry),
        type: 'POST',
        global: false,
        cache: false,
        dataType: 'text',
        success: function(data) {
            //console.log(data);
        },
        error: function(data) {
            //console.log(data);
        }
    });
};

webtools.show_log = function(filename) {
    $('#ContentHeader').html('Logfile: ' + filename);  
    $('#navfoot').html('');  

    $.ajax({
        url: '/webtools/logs/show/'+filename,
        type: 'GET',
        cache: false,
        dataType: 'JSON',
        success: function(logs) {
            
            $('#ContentBody').html(logs.join('<br>'));  
        },
        error: function(logs) {
           $('#ContentBody').html(logs);   
        }
    });
    
    
    $('#ContentFoot').html('<a href="/webtools/logs/download/'+filename+'">Download Logfile</a>');
};

// Debug every AJAX calls hit.
$( document ).ajaxComplete(function(event,request, settings) {
    webtools.log("Completed AJAX Call for URL: " + settings.url, 'Core');
});




webtools.changepassword_display = function() {
    $("input[name=newpassword]").val('');
    $('#myModalLabel').html('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button> Change Password');
    $('#myModalBody').html('<table class="table table-condensed">'+
                           '<tr><td>Old Password:</td><td><input type="password" name="oldpassword"></td></tr>'+
                           '<tr><td>New Password:</td><td><input type="password" name="newpassword"></td></tr>'+
                           '<tr><td>Repeat Password:</td><td><input type="password" name="repeatpassword"></td></tr>'+
                           '</table>'+
                           '<p id="newpassword_error"></p>');
    $('#myModalFoot').html('<button type="button" class="btn btn-default" onclick="webtools.changepassword_work();">Save</button> <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>');
    $('#myModal').modal('show');    
};

webtools.changepassword_work = function() {
    if ($("input[name=newpassword]").val().length === 0) {
        $('#newpassword_error').html('Password can\'t be empty.');
        $("input[name=newpassword]").addClass('bg-danger');
    } else if ($("input[name=newpassword]").val() != $("input[name=repeatpassword]").val()) {
        $('#newpassword_error').html('The new passwords didn\'t match.');
        $("input[name=newpassword]").addClass('bg-danger');
    } else {
        $("input[name=newpassword]").removeClass('bg-danger');
        $('#newpassword_error').html('');
        $.ajax({
            url: '/webtools/settings/password/'+$("input[name=newpassword]").val(),
            type: 'PUT',
            cache: false,
            success: function(data) {
                $('#myModalBody').html('Password has been changed.');
                $('#myModalFoot').html('<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>');
            },
            error: function(data) {
                $('#myModalBody').html('An error occured and the password has not been changed.');
                $('#myModalFoot').html('<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>');
            }
        });
    }
};

webtools.updates_check_display = function () {
    $('#myModalLabel').html('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button> Check For Updates');
    $('#myModalBody').html('<p id="updateinfo">No update information fetched yet.</p>');
    $('#myModalFoot').html('<button type="button" class="btn btn-default" onclick="webtools.updates_check();">Check</button> <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>');
    $('#myModal').modal('show'); 
};

webtools.updates_check = function () {
    $('#updateinfo').html('Please wait while fetching information from Github.');
	$.ajax({
		url: '/webtools/update/dagalufh/WebTools.bundle',
		type: 'GET',
		cache: false,
		success: function (data) {
			infoarray = [];
			//for (var key in data) {
            //  infoarray.push(key + ': ' + data[key]);  
            //}
			if (typeof(data.published_at) == 'undefined') {
                infoarray.push('No releases available.');
            } else {
                infoarray.push('Latest Update: ' + data.published_at);
                infoarray.push('Version Name: ' + data.name);
                infoarray.push('Author: <a target="_NEW" href="' + data.author.html_url + '">' + data.author.login + '</a>');
                infoarray.push('Release Notes: ' + data.body);
                infoarray.push('Download url: <a target="_NEW" href="' + data.zipball_url + '">' + data.zipball_url + '</a>');
                console.log('version compare: ' + compare(webtools.version,data.name.substring(1)) + ' A: ' + webtools.version + '> B: ' + data.name.substring(1));

                switch (compare(webtools.version,data.name.substring(1))) {
                        case 0:
                            infoarray.push('You are on the latest and greatest!');
                            break;
                        case -1:
                            infoarray.push('You\'ve fallen behind. Time to update to the greatest!');
                            break;
                        case 1:
                            infoarray.push('You are ahead of time. Your version is newer than the one on Github.');
                            break;
                }
            }
			$('#updateinfo').html(infoarray.join('<br>'));
		},
        error: function () {
            $('#updateinfo').html('An error occured while trying to fetch information from Github. Try again in a little while.');
        }
	});
};


// This function is created by http://stackoverflow.com/users/148423/joe
function compare(a, b) {
    if (a === b) {
       return 0;
    }

    var a_components = a.split(".");
    var b_components = b.split(".");

    var len = Math.min(a_components.length, b_components.length);

    // loop while the components are equal
    for (var i = 0; i < len; i++) {
        // A bigger than B
        if (parseInt(a_components[i]) > parseInt(b_components[i])) {
            return 1;
        }

        // B bigger than A
        if (parseInt(a_components[i]) < parseInt(b_components[i])) {
            return -1;
        }
    }

    // If one's a prefix of the other, the longer one is greater.
    if (a_components.length > b_components.length) {
        return 1;
    }

    if (a_components.length < b_components.length) {
        return -1;
    }

    // Otherwise they are the same.
    return 0;
}