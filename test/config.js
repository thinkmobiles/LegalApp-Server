'use strict';
//var app;
//var db;

//process.env.NODE_ENV = 'test';

//app = require('../app.js');

//var DB = require('./initDB');

module.exports = function () {
    var PostGre = app.get('PostGre');
    var image1;
    var image2;
    
    (function cleanRedis() {
        var storage = redisClient.cacheStore; //from globals;
        
        storage.flushdb(function (err) {
            if (err) {
                console.error(err);
            }
        });
    })();
    
    this.app = app;
    this.host = 'http://localhost:8888';
    this.admin = {
        email: 'admin@admin.com',
        password: '1q2w3e4r'
    };
    this.testUser1 = {
        email: 'oltest1@foo.com',
        password: '1'
    };
    this.testUser2 = {
        email: 'oltest2@foo.com',
        password: '1'
    };
    this.testFb1 = {
        facebook_id: 'fb_id_3',
        email: 'test_fb_3@mail.com',
        first_name: 'test_fb3_first_name',
        last_name: 'test_fb3_ast_name'
    };
    this.testFb2 = {
        facebook_id: 'fb_id_2',
        email: null,
        first_name: 'test_fb2_first_name',
        last_name: 'test_fb2_last_name'
    };
    
    image1 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAH4AfgMBIgACEQEDEQH/xAAcAAEAAQUBAQAAAAAAAAAAAAAABwMEBQYIAgH/xAA3EAABAwMDAgUCBAQGAwAAAAABAAIDBAURBhIhEzEHIkFRYTKBFHGRoRVCYnIjUlOS0eElM0P/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AnFERAREQEREBERAREQERfD24QfUVKOQE7See4+QqqAiIgIiICIiAiIgIiICIiAqZmi6ohMrOoRkM3DcR+S9nsoh1jrSDTtbcoK1j56qom6oi2xgRsDjEC0/VvDWMf3Gd2QW90EpVOGvc+N4AafM7v03fPwRjP2PyriCbqtORte04c0+hXPen7ldDcWXmhrd87mt3VkceIpWkluauHcMY2kbm+3GcKZqatdS/hm1bmR1Za1piALd3+ZjQeXY5LSM9iPzDY0REBERAREQEREBF43knyglMu/yn9v8AlB7XwnC1Y61pTLUOjt1zmoaeV0UldDA2SJrmnDjta4yYBBGdmOD6crFeIPiNZ7DYQaaaOuqq6E/hooJAQWEY6hcOzf3J+5AVrl4iUlJQuqQ2jayd8sVBJJWANlkYcESEDEfvyT6ZwThRANJ3rWl/dV6oukNHW1kwjijaGzOcPL9LWu4YGu3DnkNcfk5zwf09ctQV89wu9a+O19Mf+NHEdSw5a3Mf09MbXAcen3Uz0dlbT1UMz6uonFO0tgjkDMRgjHdrQTxxyUGP0xo6gsNOYmiOocC7Ezogx7w5rQ4SY4fyOOBgYHpk5plvjY5hbLNsYdzY3P3NB+/P2zhXaICIiAiKnI/Zg+mUFRECIKNXVU9FTSVNZPHBBE3c+WRwa1o9yT2VlatQ2W8lzbVdaKrc3u2CdrnD7A5WmeJUjbvqfTOk5amWlgq5X1MssWMkxtJY3kEdwTyD2Cx2s9M/wWi/itzudFXUUDm5fcIuhVR5P/zngAcXfBacoJRBxnnB9F4rOs6lmZA7bM6Nwjf7Oxwf1Ue2K+19qcyY3Q3jTbwwR1srOpJCCAf8R7Bubgc+dmPdwVz4geIH8DsEVVaaWeomrHFkFR0S6GMdt+76Xe7QDygjwXy16S08GvtRdfxIJKapikMc4yf8QTuZhx2vD24dw8YxxkjJw09Hqa2016u1I0UU8jpKVl1a9rYZtwcYxUM7QPy4DeMAjA+dSsembtdKWp1NqF8poJJyHVUw3BzzkCR479IOwHEe/sCp/wBKXKC92Zm6ljp5Ic01VRYBEEjRhzMdiPb3BBQYXQ4qZtVX+f8AB/gqOFsULIOox+15aHuA2Ejbzkdvr7Bb0rehoKO3wCCgpYKaEEkRwxhjcnucBXCAiIgIiICoVgHQc49m8n8vX9iVXXx3IweQgp00hkhaXfUMtd+YOD+4VVYyllbSzSxSuDWDPmd2y0Duf7Nv+1y578SvFS5X2vmobHUy0dojcWNMTtr6jH8ziOQD6D27oJO8VKLqXG0XKhqYW1tM50Q3SAdN5IfE9wznaHsDXfEhPoo88ZNZxas/g9stYeWxx9epiBB2zOGNh+Wjdn81FQbuIDe/YLem+Hd/o9MN1HTsIMbtwa0+Ys9XAY+n59fbHJD3OdWaZfbb3UVlXA+SmZHBMexjbw1hB4c3HbI9c+oJ3zQ99rNR0twlpbK9s9O0PqY6JzG0teSf/W6KTLWvIyct5459Abam8SbRf9BVVLqmnE1dGwMLT5RI7kB+cHb8+/bBzhWngzrmy2NldZ7nI2khnqOvTzyu8v0tbtecccNBB7d+UGfo9YVduifaqt9uqacR9M268AW2pjYeNvIMUjcZAIxnCyPgvT1BivFe6QGilqG09KwPD8thBbuLxw84LW7h32LfpoaSvgaKimgqIiMtErN459eQq9PGyJrWRMayNow1rRgAfCCuiIgIiICIiAiIg1DxNa6LSlxqGxufG6ERT9N217Y3OAc9p9w1z+PXOOey5UuNI+grZaWUgujONzezh3Dh8EEH7rsfUlukutirqKCQRzyxHoyEZDJByw/ZwBXMGoLYamnOyDo1VKH7YS7LgxnMsJ/qicSR6mNwPoEFLStht2pbVU0FLK6LUsbzLSxSPAjrIwOY2+zxgke+f02jw78TanS9NUWe9xvmp42vETJch0bx/IeDgZ7jH794vhllp5WTQyPjlY4OY9hw5pByCD6FbA6tuesdVUks0dHJcZ3Rsy9jYo5nNH1SdgScc+/YILasqRe74fwUDYJKyfbHExuG7nu445wOR/2ck9G6V8LrBp9kEz6WOvr48E1NV5sOHOWt+luD24z8qAbZK64eIcNVLHSW3ZW9eQUseYacReZxDRnygMJP3XUunrobpQF07GxVkDzDVRNOQyQYPHu0ghzT6tcEF8Ync4Df1KNjeDny/uqyIPLd2PNjPwvSIgIiICIiAiIgHkKOvEHQ8tfVvu9ncY5nBrqiONmX9Rn0Ts93tHBb/O3jvhSKiDkfUmn5Gy1E0FMIKmnG+sooxwxv+tF7xH9WHg8YWHirBLaBao7dTPqJKpsraprCZz5dojHu31xjuustQ6bpLrUU1cYYn1tJnoukyBg9xub5m/3Dt6gjha/bbRa7Hen1VDZaCnrpnE9CdrYpQT36EvLXj+ng88kdkGseDWimafdPeNQuiiuMrDDFRvILoGEAnePRxBbx6A898DaLA5ln1bHb4ZQ+mqYgync05D4dr5IfjLNs8fvtEeVmpp7e55NVaLkyU58gpXvDS7OSCzLA45PmBz8qxsDRe9TOvH4FlPRW2B1HRHcHF7nEGU+Xyjbta3gnndk5yAG4oiICIiAiIgIiICIiAiIgKlUU8NVC6CphjmieMOjkaHNcPkFVUQYh2mbM9vTdb4TCRgwHPSI9tmduPssrHGyKNscbWsY0Ya1owAPYL0iAiIgIiICIiAiIg//Z";
    
    image2 = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2hpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo2NjVBN0FFMkExMjA2ODExODIyQTk2RkJGQTE0NzQyQSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDozRDlCMDUzMzQzRjUxMUUyOUNBNThBRDY1QUM2RTU0RiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDozRDlCMDUzMjQzRjUxMUUyOUNBNThBRDY1QUM2RTU0RiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MDU4MDExNzQwNzIwNjgxMTk0NTc4MTE0MDUxMjgxNUQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NjY1QTdBRTJBMTIwNjgxMTgyMkE5NkZCRkExNDc0MkEiLz4gPC9yZGY6RGVzY3Jp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";
    
    this.comment1 = {
        data: "test_comment"
    };
    
    this.avatarBASE64 = image1;
    this.image1 = image1;
    this.image2 = image2;
    
    this.post1 = {
        privacy: PRIVACY.PUBLIC,
        end_datetime: "2016-03-25 12:00:05",
        description: "test_post #post",
        images: [
            image1,
            image2
        ]
    };

};