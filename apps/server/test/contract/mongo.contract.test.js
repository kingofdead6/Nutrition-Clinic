import { createTestMongoRepositories } from '../helpers.js';
import { runRepositoryContract } from './repositoryContract.js';

runRepositoryContract('mongo', createTestMongoRepositories);
