import { useCallback, useRef, useState } from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, clearAuthToken, isApiConnectionError } from '../api/client';

const REPORT_REASONS = [
  { label: 'Spam', value: 'spam' },
  { label: 'Harassment', value: 'harassment' },
  { label: 'Inappropriate Content', value: 'inappropriate_content' },
  { label: 'Fake Account', value: 'fake_account' },
  { label: 'Other', value: 'other' },
];

function requestMessage(error, fallback) {
  const errors = error.response?.data?.errors;

  if (errors) return Object.values(errors).flat()[0] || fallback;
  if (error.response?.data?.message) return error.response.data.message;
  if (isApiConnectionError(error)) {
    return 'Unable to connect to the Cleanify server. Check your network connection and try again.';
  }

  return fallback;
}

function CommentAvatar({ comment }) {
  const [photoFailed, setPhotoFailed] = useState(false);

  if (comment.profile_photo_url && !photoFailed) {
    return (
      <Image
        source={{ uri: comment.profile_photo_url }}
        style={styles.commentAvatar}
        onError={() => setPhotoFailed(true)}
      />
    );
  }

  return (
    <View style={styles.commentInitialAvatar}>
      <Text style={styles.commentInitial}>{comment.author_initial || '?'}</Text>
    </View>
  );
}

export default function ReportInteractions({ report, onReportUpdate, currentUserId }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const likePendingRef = useRef(false);
  const commentsLoadingRef = useRef(false);
  const commentPostingRef = useRef(false);
  const userReportPendingRef = useRef(false);
  const [likePending, setLikePending] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentPosting, setCommentPosting] = useState(false);
  const [userReportVisible, setUserReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [userReportPending, setUserReportPending] = useState(false);

  const handleUnauthorized = useCallback(async (error) => {
    if (error.response?.status !== 401) return false;

    await clearAuthToken();
    setCommentsVisible(false);
    router.replace('/login');
    return true;
  }, [router]);

  const toggleLike = async () => {
    if (likePendingRef.current) return;

    likePendingRef.current = true;
    setLikePending(true);

    try {
      const { data } = await api.post(`/reports/${report.id}/like`);
      onReportUpdate(report.id, {
        is_liked: Boolean(data.liked),
        likes_count: Math.max(0, Number(data.likes_count) || 0),
      });
    } catch (error) {
      if (!await handleUnauthorized(error)) {
        Alert.alert('Unable to update like', requestMessage(error, 'Please try again.'));
      }
    } finally {
      likePendingRef.current = false;
      setLikePending(false);
    }
  };

  const loadComments = useCallback(async () => {
    if (commentsLoadingRef.current) return;

    commentsLoadingRef.current = true;
    setCommentsLoading(true);
    setCommentsError(null);

    try {
      const { data } = await api.get(`/reports/${report.id}/comments`);
      setComments(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      if (!await handleUnauthorized(error)) {
        setCommentsError(requestMessage(error, 'Unable to load comments. Please try again.'));
      }
    } finally {
      commentsLoadingRef.current = false;
      setCommentsLoading(false);
    }
  }, [handleUnauthorized, report.id]);

  const openComments = () => {
    setCommentsVisible(true);
    loadComments();
  };

  const submitComment = async () => {
    const comment = commentText.trim();
    if (!comment || commentPostingRef.current) return;

    commentPostingRef.current = true;
    setCommentPosting(true);

    try {
      const { data } = await api.post(`/reports/${report.id}/comment`, { comment });
      setComments((current) => [data.comment, ...current.filter((item) => item.id !== data.comment.id)]);
      onReportUpdate(report.id, {
        comments_count: Math.max(0, Number(data.comments_count) || 0),
      });
      setCommentText('');
      setCommentsError(null);
    } catch (error) {
      if (!await handleUnauthorized(error)) {
        Alert.alert('Unable to post comment', requestMessage(error, 'Please try again.'));
      }
    } finally {
      commentPostingRef.current = false;
      setCommentPosting(false);
    }
  };

  const openUserReport = () => {
    Alert.alert(
      'Report options',
      `Choose an action for ${report.author?.name || 'this user'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report User', style: 'destructive', onPress: () => setUserReportVisible(true) },
      ]
    );
  };

  const closeUserReport = () => {
    if (!userReportPendingRef.current) setUserReportVisible(false);
  };

  const submitUserReport = async () => {
    const authorId = report.author?.id;
    if (!authorId || !reportReason || userReportPendingRef.current) return;

    userReportPendingRef.current = true;
    setUserReportPending(true);

    try {
      const { data } = await api.post(`/users/${authorId}/report`, {
        reason: reportReason,
        description: reportDetails.trim(),
        report_id: report.id,
      });

      setUserReportVisible(false);
      setReportReason('');
      setReportDetails('');
      Alert.alert('Report submitted', data.message || 'User reported successfully. Our team will review this report.');
    } catch (error) {
      if (!await handleUnauthorized(error)) {
        Alert.alert('Unable to report user', requestMessage(error, 'Unable to submit the report. Please try again.'));
      }
    } finally {
      userReportPendingRef.current = false;
      setUserReportPending(false);
    }
  };

  const likesCount = Math.max(0, Number(report.likes_count) || 0);
  const commentsCount = Math.max(0, Number(report.comments_count) || 0);
  const canReportUser = currentUserId != null
    && report.author?.id != null
    && String(currentUserId) !== String(report.author.id);

  return (
    <>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={toggleLike}
          disabled={likePending}
          activeOpacity={0.65}
          accessibilityRole="button"
          accessibilityLabel={report.is_liked ? 'Unlike report' : 'Like report'}
        >
          {likePending ? (
            <ActivityIndicator size="small" color="#17843f" style={styles.actionSpinner} />
          ) : (
            <FontAwesome5 name="heart" solid={report.is_liked} size={15} color={report.is_liked ? '#17843f' : '#7b8580'} />
          )}
          <Text style={[styles.actionText, report.is_liked && styles.actionTextActive]}>
            {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={openComments}
          activeOpacity={0.65}
          accessibilityRole="button"
          accessibilityLabel={`Open ${commentsCount} comments`}
        >
          <FontAwesome5 name="comment" size={15} color="#7b8580" />
          <Text style={styles.actionText}>
            {commentsCount} {commentsCount === 1 ? 'Comment' : 'Comments'}
          </Text>
        </TouchableOpacity>

        {canReportUser ? (
          <TouchableOpacity
            style={styles.overflowButton}
            onPress={openUserReport}
            activeOpacity={0.65}
            accessibilityRole="button"
            accessibilityLabel={`More actions for ${report.author?.name || 'report author'}`}
          >
            <FontAwesome5 name="ellipsis-h" size={15} color="#7b8580" />
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal
        visible={commentsVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setCommentsVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setCommentsVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close comments"
          />
          <View style={styles.commentSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.commentHeader}>
              <View style={styles.commentHeaderText}>
                <Text style={styles.commentTitle}>Comments</Text>
                <Text style={styles.reportContext} numberOfLines={1}>{report.description}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setCommentsVisible(false)} accessibilityLabel="Close comments">
                <FontAwesome5 name="times" size={16} color="#667085" />
              </TouchableOpacity>
            </View>

            <View style={styles.commentListArea}>
              {commentsLoading ? (
                <View style={styles.commentState}>
                  <ActivityIndicator color="#17843f" />
                  <Text style={styles.commentStateText}>Loading comments...</Text>
                </View>
              ) : commentsError ? (
                <View style={styles.commentState}>
                  <Text style={styles.commentStateText}>{commentsError}</Text>
                  <TouchableOpacity onPress={loadComments}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={comments}
                  keyExtractor={(item) => String(item.id)}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={comments.length ? styles.commentList : styles.emptyCommentList}
                  ListEmptyComponent={<Text style={styles.emptyComments}>No comments yet.</Text>}
                  renderItem={({ item }) => (
                    <View style={styles.commentRow}>
                      <CommentAvatar comment={item} />
                      <View style={styles.commentBody}>
                        <View style={styles.commentMeta}>
                          <Text style={styles.commentAuthor} numberOfLines={1}>{item.author}</Text>
                          <Text style={styles.commentTimestamp}>{item.timestamp}</Text>
                        </View>
                        <Text style={styles.commentText}>{item.comment}</Text>
                      </View>
                    </View>
                  )}
                />
              )}
            </View>

            <View style={[styles.commentComposer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                placeholderTextColor="#9ca3af"
                maxLength={500}
                multiline
                editable={!commentPosting}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.sendButton, (!commentText.trim() || commentPosting) && styles.sendButtonDisabled]}
                onPress={submitComment}
                disabled={!commentText.trim() || commentPosting}
              >
                {commentPosting ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.sendText}>Send</Text>}
              </TouchableOpacity>
              {commentText.length >= 450 ? <Text style={styles.characterCount}>{commentText.length}/500</Text> : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={userReportVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeUserReport}
      >
        <KeyboardAvoidingView
          style={styles.reportModalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeUserReport}
            accessibilityRole="button"
            accessibilityLabel="Close report user form"
          />
          <View style={[styles.reportModal, { marginBottom: Math.max(insets.bottom, 18) }]}>
            <View style={styles.reportModalHeader}>
              <View style={styles.reportModalTitleArea}>
                <Text style={styles.reportModalTitle}>Report User</Text>
                <Text style={styles.reportModalSupport}>Your report will be reviewed by the Cleanify team.</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={closeUserReport} disabled={userReportPending} accessibilityLabel="Close report user form">
                <FontAwesome5 name="times" size={16} color="#667085" />
              </TouchableOpacity>
            </View>

            <Text style={styles.reportFieldLabel}>Reason</Text>
            <View style={styles.reasonList}>
              {REPORT_REASONS.map((reason) => {
                const selected = reportReason === reason.value;
                return (
                  <TouchableOpacity
                    key={reason.value}
                    style={[styles.reasonOption, selected && styles.reasonOptionSelected]}
                    onPress={() => setReportReason(reason.value)}
                    disabled={userReportPending}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                  >
                    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <Text style={[styles.reasonLabel, selected && styles.reasonLabelSelected]}>{reason.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.reportFieldLabel}>Additional details (optional)</Text>
            <TextInput
              style={styles.reportDetailsInput}
              value={reportDetails}
              onChangeText={setReportDetails}
              placeholder="Add helpful context for the review team"
              placeholderTextColor="#9ca3af"
              maxLength={1000}
              multiline
              editable={!userReportPending}
              textAlignVertical="top"
            />
            <Text style={styles.reportCharacterCount}>{reportDetails.length}/1000</Text>

            <View style={styles.reportModalActions}>
              <TouchableOpacity style={styles.cancelReportButton} onPress={closeUserReport} disabled={userReportPending}>
                <Text style={styles.cancelReportText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitReportButton, (!reportReason || userReportPending) && styles.submitReportButtonDisabled]}
                onPress={submitUserReport}
                disabled={!reportReason || userReportPending}
              >
                {userReportPending ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.submitReportText}>Submit Report</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#edf0ee' },
  actionButton: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 7, paddingRight: 4 },
  overflowButton: { width: 34, height: 32, marginLeft: 'auto', borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  actionSpinner: { width: 15 },
  actionText: { color: '#667085', fontSize: 12, fontWeight: '600' },
  actionTextActive: { color: '#17843f' },
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17, 24, 39, 0.38)' },
  commentSheet: { minHeight: '55%', maxHeight: '88%', backgroundColor: '#ffffff', borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#d1d5db', alignSelf: 'center', marginTop: 9 },
  commentHeader: { minHeight: 68, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#edf0ee' },
  commentHeaderText: { flex: 1, paddingRight: 12 },
  commentTitle: { color: '#111827', fontSize: 18, fontWeight: '800' },
  reportContext: { marginTop: 3, color: '#7b8580', fontSize: 11 },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f6f4', alignItems: 'center', justifyContent: 'center' },
  commentListArea: { flex: 1, minHeight: 180 },
  commentList: { paddingHorizontal: 18, paddingVertical: 4 },
  emptyCommentList: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyComments: { color: '#7b8580', fontSize: 13 },
  commentState: { flex: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  commentStateText: { color: '#667085', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retryText: { color: '#17843f', fontSize: 13, fontWeight: '700' },
  commentRow: { flexDirection: 'row', gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f0f2f1' },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#e5e9e7' },
  commentInitialAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#e4f4e8', alignItems: 'center', justifyContent: 'center' },
  commentInitial: { color: '#17843f', fontSize: 13, fontWeight: '800' },
  commentBody: { flex: 1 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  commentAuthor: { flex: 1, color: '#1f2937', fontSize: 13, fontWeight: '700' },
  commentTimestamp: { color: '#9ca3af', fontSize: 10 },
  commentText: { marginTop: 4, color: '#374151', fontSize: 13, lineHeight: 19 },
  commentComposer: { paddingHorizontal: 14, paddingTop: 11, borderTopWidth: 1, borderTopColor: '#e5e9e7', backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
  commentInput: { flex: 1, minHeight: 42, maxHeight: 96, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 9, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, color: '#111827', fontSize: 13 },
  sendButton: { minWidth: 62, height: 42, borderRadius: 11, backgroundColor: '#17843f', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  sendButtonDisabled: { opacity: 0.5 },
  sendText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  characterCount: { position: 'absolute', right: 86, top: -17, color: '#9ca3af', fontSize: 10 },
  reportModalRoot: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 14, backgroundColor: 'rgba(17, 24, 39, 0.38)' },
  reportModal: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: 18, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e5e9e7', shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 20, elevation: 8 },
  reportModalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  reportModalTitleArea: { flex: 1, paddingRight: 12 },
  reportModalTitle: { color: '#111827', fontSize: 18, fontWeight: '800' },
  reportModalSupport: { marginTop: 4, color: '#7b8580', fontSize: 11, lineHeight: 16 },
  reportFieldLabel: { marginBottom: 8, color: '#374151', fontSize: 13, fontWeight: '700' },
  reasonList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 17 },
  reasonOption: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: '#d8ddda', backgroundColor: '#ffffff' },
  reasonOptionSelected: { borderColor: '#c95f5f', backgroundColor: '#fff7f7' },
  radioOuter: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: '#9ca3af', alignItems: 'center', justifyContent: 'center' },
  radioOuterSelected: { borderColor: '#b84343' },
  radioInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#b84343' },
  reasonLabel: { color: '#4b5563', fontSize: 12, fontWeight: '600' },
  reasonLabelSelected: { color: '#9f3434' },
  reportDetailsInput: { minHeight: 94, maxHeight: 150, paddingHorizontal: 12, paddingTop: 11, paddingBottom: 11, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, color: '#111827', fontSize: 13, lineHeight: 19 },
  reportCharacterCount: { alignSelf: 'flex-end', marginTop: 5, color: '#9ca3af', fontSize: 10 },
  reportModalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 16 },
  cancelReportButton: { minWidth: 82, height: 42, paddingHorizontal: 15, borderRadius: 11, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  cancelReportText: { color: '#4b5563', fontSize: 13, fontWeight: '700' },
  submitReportButton: { minWidth: 132, height: 42, paddingHorizontal: 15, borderRadius: 11, backgroundColor: '#b84343', alignItems: 'center', justifyContent: 'center' },
  submitReportButtonDisabled: { opacity: 0.5 },
  submitReportText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
});
