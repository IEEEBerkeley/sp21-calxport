// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

chrome.runtime.onMessage.addListener(message => {
  console.log("background: onMessage", message);

  // Add this line:
  return Promise.resolve("Dummy response to keep the console quiet");
});