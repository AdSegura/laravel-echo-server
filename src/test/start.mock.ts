#!/usr/bin/env node

import {MockLaravel} from './mock_laravel';
import {FsUtils} from "../utils/fsUtils";

let mock = new MockLaravel(FsUtils.getConfigfile());

mock.init();
