import $ from 'jquery';
import 'bootstrap/less/bootstrap.less';
import 'font-awesome/css/font-awesome.css';
import filesize from 'filesize';
import moment from 'moment';

// Whitelist prefixes (projects), to exclude any other possibly
// sensitive data or irrelevant site data.
const whitelistPrefixes = [
    "go-ethereum",
    "emerald-wallet"
];
const projects = {
    "geth": {
        name: "Geth Classic",
        baseEndpoint: "go-ethereum/",
        prefixes: [],
        files: []
    },
    "emeraldWallet": {
        name: "Emerald Wallet",
        baseEndpoint: "emerald-wallet/",
        prefixes: [],
        files: []
    }
};
const gcpRequestSettings = {
    "async": true,
    "crossDomain": true,
    "url": "https://www.googleapis.com/storage/v1/b/builds.etcdevteam.com/o",
    "method": "GET",
    "headers": {},
    "data": {
        delimiter: "/",
        prefix: "",
        maxResults: 100
    }
};

function activateTab(el) {
    $('.nav-tabs li').removeClass('active');
    $(el).parent().addClass('active');
}

function init() {


        // DOM elements
        let $base = $('#build-items table tbody');
        let $breadcrumbs = $("#project-breadcrumbs");
        let $selectEmeraldWallet = $("#select-emerald-wallet");
        let $selectGeth = $("#select-geth");

        function setProjectEndpoint(prefix) {
                var s = gcpRequestSettings;
                s["data"]["prefix"] = prefix;
                return s;
        }

        function getBaseEndpoint(project) {
                if (project.files.length > 0) {
                        return renderProjectFiles();
                }
                let allfiles = [];
                function getArbitraryEndpoints(prefixes) {
                        let defer = $.Deferred();
                        let defers = [];
                        for (var i = 0; i < prefixes.length; i++) {
                                defers.push($.ajax(setProjectEndpoint(prefixes[i])));
                        }
                        $.when(...defers).done(function(...resArray) {
                                defer.resolve(resArray);
                        }).fail(function(errs) {
                                console.log(errs);
                                defer.reject(errs);
                        });
                        return defer.promise();
                }

                function gotEndpoints(resArr) {
                        if (resArr[0].constructor !== Array) {
                                resArr = [resArr];
                        }
                        console.log("resArr", resArr);
                        let moarPrefixes = [];
                        for (var j = 0; j < resArr.length; j++) {
                                // 0: {kind: "storage#objects", prefixes: Array(1)}1: "success"2: {readyState: 4, getResponseHeader: ƒ, getAllResponseHeaders: ƒ, setRequestHeader: ƒ, overrideMimeType: ƒ, …}length: 3__proto__: Array(0)
                                let res = resArr[j];
                                if (res[1] !== "success") {
                                        console.log(res);
                                        return;
                                }
                                let response = res[0];
                                console.log("prefixes", response.prefixes, "items", response.items);
                                if (typeof response.items !== "undefined") {
                                        let files = response.items.filter((item) => {
                                                let isNested = item.name.split("/").length >= 2;
                                                let isDir = item.name.endsWith("/");
                                                return isNested && !isDir;
                                        });
                                        allfiles = allfiles.concat(files);
                                }

                                if (typeof response.prefixes !== "undefined" && response.prefixes.length > 0) {
                                        let prefixes = response.prefixes.filter((prefix) => {
                                                let basename = prefix.split("/")[0];
                                                let pos = whitelistPrefixes.indexOf(basename);
                                                return pos >= 0;
                                        });
                                        moarPrefixes = prefixes;
                                }
                        }
                        if (moarPrefixes.length > 0) {
                                getArbitraryEndpoints(moarPrefixes).then(gotEndpoints);
                        } else {
                                project.files = allfiles.sort((a, b) =>
                                        moment(b.timeCreated) - moment(a.timeCreated)
                                );
                                renderProjectFiles();
                        }
                }
                function renderProjectFiles() {
                        $("#current-project-header").html(`${project.name} <small>Latest Artifacts</small>`);
                        renderItems(project.files);
                }

                // Kickoff.
                getArbitraryEndpoints([project.baseEndpoint])
                        .then(gotEndpoints)
                        .fail(function(e) {
                                console.log(e);
                        });
        }

        // Input listeners
        $selectEmeraldWallet.on("click", function(el) {
                activateTab($selectEmeraldWallet);
                getBaseEndpoint(projects.emeraldWallet);
        });
        $selectGeth.on("click", function(el) {
                activateTab($selectGeth);
                getBaseEndpoint(projects.geth);
        });

        function renderItems(files) {
                if (typeof files === "undefined") { return; }
                $base.html("");
                files.map((item) => {
                        let name = item.name.substr(item.name.lastIndexOf('/') + 1);
                        let link = `/${item.name}`;
                        let nameRow = `<td><a href="${link}">${name}</a></td>`;
                        let size = filesize(item.size);
                        let sizeRow = `<td>${size}</td>`;
                        let time = moment(item.timeCreated);
                        let timeRow = `<td>${time.format('lll')}</td>`;
                        let row = `<tr>${sizeRow}${nameRow}${timeRow}</tr>`;
                        $base.append(row)
                });
        }

        getBaseEndpoint(projects.emeraldWallet);
}

$(document).ready(init);
