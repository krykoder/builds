import $ from 'jquery';
import 'bootstrap/less/bootstrap.less';
import 'font-awesome/css/font-awesome.css';
import './style.scss';
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
        basePath: "go-ethereum/",
        prefixes: [],
        files: []
    },
    "emeraldWallet": {
        name: "Emerald Wallet",
        basePath: "emerald-wallet/",
        prefixes: [],
        files: []
    },
    "emeraldCLI": {
        name: "Emerald CLI",
        basePath: "emerald-cli/",
        prefixes: [],
        files: []
    },
    "sputnikVMDev": {
        name: "SputnikVM Dev",
        basePath: "sputnikvm-dev/",
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
        maxResults: 1000
    }
};

function withPrefix(prefix) {
    let req = Object.assign({}, gcpRequestSettings);
    req["data"]["prefix"] = prefix;
    return req;
}


function activateTab(el) {
    $('.nav-tabs li').removeClass('active');
    $(el).parent().addClass('active');
}

function getVersions(basePath) {
    let req = withPrefix(basePath);
    let defer = $.Deferred();
    $.ajax(req)
        .then((resp) => {
            console.log('v1', resp);
            return defer.resolve(resp.prefixes)
        })
        .fail(defer.reject);
    return defer.promise();
}

function getFiles(prefix) {
    let req = withPrefix(prefix);
    let defer = $.Deferred();
    $.ajax(req)
        .then((resp) => defer.resolve(resp.items))
        .fail(defer.reject);
    return defer.promise();
}

function justVersion(path) {
    let from = path.indexOf('/');
    return path.substring(from + 1, path.length - 1);
}

function displayVersions(project, versions) {
    let $base = $('#versions').find('ul');
    $base.empty();
    versions.forEach((v) => {
        $base.append(`<li><a href="#">${justVersion(v)}</a></li>`)
    });
    $base.find('li a').click((e) => {
        let showVersion = $(e.target).html();
        displayProject(project, showVersion);
        return false;
    })
}

// Shared file renderer for all projects.
function renderItems(files) {
    if (typeof files === "undefined") {
        return;
    }
    let $base = $('#build-items').find('table tbody');
    $base.empty();
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

function renderProjectFiles(name, files) {
    $("#current-project-header").html(`${name} <small>Latest Artifacts</small>`);
    renderItems(files);
}

function displayProject(project, version) {
    function showFiles(items) {
        let files = items.sort((a, b) =>
            moment(b.timeCreated) - moment(a.timeCreated)
        );
        renderProjectFiles(project.name, files);
    }

    // Kickoff.
    getVersions(project.basePath)
        .then((versions) => {
            console.log('versions', versions);
            displayVersions(project, versions);
            let useVersion;
            if (typeof version === 'string' && version.length > 1) {
                useVersion = versions.find((v) => v.indexOf(version) > 0)
            } else {
                useVersion = versions.pop();
            }
            return getFiles(useVersion);
        })
        .then(showFiles)
        .fail(console.error);

}

function init() {
    
    // Project selectors.
    let $selectEmeraldWallet = $("#select-emerald-wallet");
    let $selectGeth = $("#select-geth");
    let $selectEmeraldCLI = $("#select-emeraldcli");
    let $selectSputnikVMDev = $("#select-sputnikvmdev");

    // Project input listeners
    $selectEmeraldWallet.on("click", function (el) {
        activateTab($selectEmeraldWallet);
        displayProject(projects.emeraldWallet);
    });
    $selectGeth.on("click", function (el) {
        activateTab($selectGeth);
        displayProject(projects.geth);
    });
    $selectEmeraldCLI.on("click", function (el) {
        activateTab($selectEmeraldCLI);
        displayProject(projects.emeraldCLI);
    });
    $selectSputnikVMDev.on("click", function (el) {
        activateTab($selectSputnikVMDev);
        displayProject(projects.sputnikVMDev);
    });

    displayProject(projects.emeraldWallet);
}

$(document).ready(init);
