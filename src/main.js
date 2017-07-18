import $ from 'jquery';
import 'bootstrap/less/bootstrap.less';
import 'font-awesome/css/font-awesome.css';
import filesize from 'filesize';
import moment from 'moment';

function showLatest() {
    const settings = {
        "async": true,
        "crossDomain": true,
        "url": "https://www.googleapis.com/storage/v1/b/builds.etcdevteam.com/o",
        "method": "GET",
        "headers": {},
        "data": {
            delimiter: "/",
            prefix: "emerald-wallet/preview/",
            maxResults: 100
        }
    };

    let base = $('#latest-wallet table tbody');

    $.ajax(settings).done(function (response) {
        console.log(response.items);
        let files = response.items.filter((item) => !item.name.endsWith('/'));
        files = files.sort((a, b) =>
            moment(b.timeCreated) - moment(a.timeCreated)
        );
        files.map((item) => {
            let name = item.name.substr(item.name.lastIndexOf('/')+1);
            let link = `/${item.name}`;
            let nameRow = `<td><a href="${link}">${name}</a></td>`;
            let size = filesize(item.size);
            let sizeRow = `<td>${size}</td>`;
            let time = moment(item.timeCreated);
            let timeRow = `<td>${time.format('lll')}</td>`;
            let row = `<tr>${sizeRow}${nameRow}${timeRow}</tr>`;
            base.append(row)
        });
    });
}

$(document).ready(showLatest);
