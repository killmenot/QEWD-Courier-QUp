/*

 ----------------------------------------------------------------------------
 |                                                                          |
 | Copyright (c) 2019 Ripple Foundation Community Interest Company          |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://rippleosi.org                                                     |
 | Email: code.custodian@rippleosi.org                                      |
 |                                                                          |
 | Author: Rob Tweed, M/Gateway Developments Ltd                            |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  11 February 2019

*/

var fetchAndCacheHeading = require('../../utils/openehr/fetchAndCacheHeading');
var getHeadingTableFromCache = require('../../utils/openehr/getHeadingTableFromCache');
var tools = require('../../../utils/tools');

function getHeadingTable(patientId, heading, session, callback) {
  var results = getHeadingTableFromCache.call(this, patientId, heading, session);
  var fetch_count = session.data.$(['headings', 'byPatientId', patientId, heading, 'fetch_count']).increment();
  callback({
    api: 'getPatientHeadingSummary',
    use: 'results',
    results: results
  });
}

module.exports = function(args, finished) {

  var patientId = args.patientId;

  // override patientId for PHR Users - only allowed to see their own data

  if (args.session.role === 'phrUser') patientId = args.session.nhsNumber;

  var valid = tools.isPatientIdValid(patientId);
  if (valid.error) return finished(valid);

  var heading = args.heading;

  if (!tools.isHeadingValid.call(this, heading)) {
    console.log('*** ' + heading + ' has not yet been added to middle-tier processing');
    return finished([]);
  }

  var session = args.req.qewdSession;
  var self = this;

  fetchAndCacheHeading.call(this, patientId, heading, session, function(response) {
    if (!response.ok) {
      console.log('*** No results could be returned from the OpenEHR servers for heading ' + heading);
      return finished([]);
    }
    else {
      console.log('heading ' + heading + ' for ' + patientId + ' is cached');
      getHeadingTable.call(self, patientId, heading, session, function(responseObj) {
        //if (args.req.query && args.req.query.discovery_sync === 'no') {
        //  responseObj.discovery_sync = false;
        //}
        finished(responseObj);
      });
    }
  });

};


