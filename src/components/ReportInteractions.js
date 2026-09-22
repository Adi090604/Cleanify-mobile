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

export default function ReportInteractions({ report, onReportUpdate }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const likePendingRef = useRef(false);
  const commentsLoadingRef = useRef(false);
  const commentPostingRef = useRef(false);
  const [likePending, setLikePending] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentPosting, setCommentPosting] = useState(false);

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

  const likesCount = Math.max(0, Number(report.likes_count) || 0);
  const commentsCount = Math.max(0, Number(report.comments_count) || 0);

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
    </>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#edf0ee' },
  actionButton: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 7, paddingRight: 4 },
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
});
