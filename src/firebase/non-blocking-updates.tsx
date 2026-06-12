'use client';
  
import {
 setDoc,
 addDoc,
 updateDoc,
 deleteDoc,
 CollectionReference,
 DocumentReference,
 SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Returns the Promise so callers can await if needed.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
 return setDoc(docRef, data, options).catch(error => {
  if (error?.code === 'permission-denied') {
   errorEmitter.emit(
    'permission-error',
    new FirestorePermissionError({
     path: docRef.path,
     operation: 'write',
     requestResourceData: data,
    })
   )
  }
  throw error;
 })
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Returns the Promise for the new doc ref.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
 const promise = addDoc(colRef, data)
  .catch(error => {
   if (error?.code === 'permission-denied') {
    errorEmitter.emit(
     'permission-error',
     new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: data,
     })
    )
   }
   throw error;
  });
 return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Returns the Promise so callers can await if needed.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
 return updateDoc(docRef, data)
  .catch(error => {
   if (error?.code === 'permission-denied') {
    errorEmitter.emit(
     'permission-error',
     new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
     })
    )
   }
   throw error;
  });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Returns the Promise so callers can await if needed.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
 return deleteDoc(docRef)
  .catch(error => {
   if (error?.code === 'permission-denied') {
    errorEmitter.emit(
     'permission-error',
     new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
     })
    )
   }
   throw error;
  });
}
